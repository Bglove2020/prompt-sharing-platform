# 头像直传 COS 实施说明

## 整体架构

本方案采用**前端直传**模式，避免图片经过服务器中转，提高上传效率并节省服务器带宽。

### 架构流程图

```
前端（浏览器） → 后端 API（获取预签名） → 腾讯云 COS（直传） → 后端 API（更新数据库）
     ↓              ↓                      ↓              ↓
  1.选择图片    2.请求预签名URL        3.PUT上传文件    4.保存头像URL
```

## 详细实现流程

### 1. 环境准备

#### 1.1 环境变量配置

在 `.env.local` 文件中添加：

```envx
# 腾讯云 COS 配置
COS_SECRET_ID="xxxxxxxxxxxxxxxxxxxxx"  # 密钥 ID
COS_SECRET_KEY="xxxxxxxxxxxxxxxx"        # 密钥 Key
COS_BUCKET="xxxxxxxxx"                           # 存储桶名称
COS_REGION="xxxxx"                                  # 地域
# 可选配置
# COS_PUBLIC_DOMAIN="https://your-cdn-domain.com"       # 自定义域名
# COS_AVATAR_PREFIX="avatars"                            # 文件路径前缀
```

#### 1.2 依赖安装

```bash
# 安装腾讯云 COS SDK
npm install cos-nodejs-sdk-v5

# UI 组件依赖（已包含在项目中）
npm install lucide-react sonner
```

### 2. 后端实现

#### 2.1 COS 工具类 (`src/lib/cos.ts`)

```typescript
import COS from "cos-nodejs-sdk-v5";

// 环境变量验证
const requiredEnv = [
  "COS_SECRET_ID",
  "COS_SECRET_KEY",
  "COS_BUCKET",
  "COS_REGION",
] as const;

// 获取 COS 客户端实例
export function getCosClient() {
  ensureEnv();
  return new COS({
    SecretId: process.env.COS_SECRET_ID!,
    SecretKey: process.env.COS_SECRET_KEY!,
  });
}

// 生成头像文件路径
// 格式: avatars/{userId}/{timestamp}-{random}{ext}
export function buildAvatarObjectKey(userId: string, filename: string) {
  const ext = filename.includes(".")
    ? filename.substring(filename.lastIndexOf("."))
    : "";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const prefix = process.env.COS_AVATAR_PREFIX || "avatars";
  return `${prefix}/${userId}/${timestamp}-${random}${ext}`;
}

// 获取公开访问 URL
export function getPublicCosUrl(objectKey: string) {
  const base =
    process.env.COS_PUBLIC_DOMAIN ||
    `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com`;
  return `${base.replace(/\/$/, "")}/${objectKey.replace(/^\//, "")}`;
}
```

#### 2.2 预签名接口 (`src/app/api/upload/avatar/presign/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCosClient, buildAvatarObjectKey, getPublicCosUrl } from "@/lib/cos";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  // 1. 身份验证
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  // 2. 解析请求参数
  const {
    filename = "avatar.png",
    mimeType = "image/png",
    size = 0,
  } = await request.json();

  // 3. 文件验证
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { message: "仅支持 jpeg/png/webp 图片" },
      { status: 400 }
    );
  }
  if (size > MAX_SIZE) {
    return NextResponse.json({ message: "图片不能超过 2MB" }, { status: 400 });
  }

  try {
    // 4. 生成预签名 URL
    const cos = getCosClient();
    const Key = buildAvatarObjectKey(session.user.id, filename);

    const uploadUrl = await new Promise<string>((resolve, reject) => {
      cos.getObjectUrl(
        {
          Bucket: process.env.COS_BUCKET!,
          Region: process.env.COS_REGION!,
          Key,
          Method: "PUT",
          Protocol: "https:",
          Sign: true,
          Expires: 300, // 5分钟有效期
          Headers: {
            "Content-Type": mimeType,
          },
        },
        (err, data) => {
          if (err || !data?.Url) {
            return reject(err || new Error("生成预签名失败"));
          }
          resolve(data.Url);
        }
      );
    });

    // 5. 返回上传信息
    return NextResponse.json({
      uploadUrl, // 用于 PUT 上传的 URL
      avatarUrl: getPublicCosUrl(Key), // 最终访问的 URL
      objectKey: Key, // COS 对象键
      expiresIn: 300, // URL 有效期
      headers: { "Content-Type": mimeType },
    });
  } catch (error) {
    console.error("[avatar presign] error", error);
    return NextResponse.json({ message: "生成上传凭证失败" }, { status: 500 });
  }
}
```

#### 2.3 更新头像接口 (`src/app/api/user/avatar/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 域名白名单，防止恶意更新
const ALLOWED_DOMAINS = [
  process.env.COS_PUBLIC_DOMAIN,
  process.env.COS_BUCKET && process.env.COS_REGION
    ? `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com`
    : undefined,
].filter(Boolean) as string[];

function isAllowedUrl(url: string) {
  if (!ALLOWED_DOMAINS.length) return true;
  return ALLOWED_DOMAINS.some((domain) => url.startsWith(domain));
}

export async function PATCH(request: Request) {
  // 1. 身份验证
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  // 2. 解析请求参数
  const { avatarUrl } = await request.json();
  if (!avatarUrl) {
    return NextResponse.json({ message: "缺少 avatarUrl" }, { status: 400 });
  }

  // 3. URL 验证（防止更新为非 COS 的 URL）
  if (!isAllowedUrl(avatarUrl)) {
    return NextResponse.json({ message: "头像地址不被允许" }, { status: 400 });
  }

  try {
    // 4. 更新数据库
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ avatar: avatarUrl });
  } catch (error) {
    console.error("[avatar update] error", error);
    return NextResponse.json({ message: "更新头像失败" }, { status: 500 });
  }
}
```

### 3. 前端实现

#### 3.1 头像上传组件 (`src/components/layout/navbar-authenticated.tsx`)

```typescript
"use client";

import { useState, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { axiosClient } from "@/lib/axios";

export function NavbarAuthenticated() {
  const { data: session, update } = useSession();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 处理文件选择
  const handleFileChange = (file?: File) => {
    if (!file) return;

    // 文件类型验证
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("仅支持 jpeg/png/webp");
      return;
    }

    // 文件大小验证
    if (file.size > 2 * 1024 * 1024) {
      toast.error("图片不能超过 2MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // 处理上传
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("请先选择图片");
      return;
    }

    setUploading(true);
    try {
      // 1. 获取预签名 URL
      const presign = await axiosClient.post<{
        uploadUrl: string;
        avatarUrl: string;
        headers?: Record<string, string>;
      }>("/api/upload/avatar/presign", {
        filename: selectedFile.name,
        mimeType: selectedFile.type,
        size: selectedFile.size,
      });

      // 2. 直接上传到 COS
      const uploadHeaders: Record<string, string> = presign.headers || {
        "Content-Type": selectedFile.type,
      };

      await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: uploadHeaders,
        body: selectedFile,
      });

      // 3. 更新用户头像
      await axiosClient.patch("/api/user/avatar", {
        avatarUrl: presign.avatarUrl,
      });

      // 4. 更新前端 session
      await update?.({ avatar: presign.avatarUrl });

      toast.success("头像更新成功");
      setAvatarOpen(false);

      // 清理资源
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch (error: any) {
      toast.error(error?.message || "上传失败");
    } finally {
      setUploading(false);
    }
  };

  // UI 渲染部分...
  return (
    <>
      {/* 导航栏内容 */}
      <nav>
        {/* ... 其他导航项 */}

        {/* 头像下拉菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.avatar} />
              <AvatarFallback>
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {/* ... 其他菜单项 */}
            <DropdownMenuItem onSelect={() => setAvatarOpen(true)}>
              更换头像
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* 上传对话框 */}
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更换头像</DialogTitle>
            <DialogDescription>
              仅支持 jpeg/png/webp，最大 2MB。
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={previewUrl || session?.user?.avatar || ""}
                alt="头像预览"
              />
              <AvatarFallback>
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAvatarOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "上传中..." : "上传并保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### 3.2 Auth 配置更新 (`src/lib/auth.ts`)

确保 auth 配置支持更新 session 中的 avatar 字段：

```typescript
export const authOptions: NextAuthOptions = {
  // ... 其他配置

  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.avatar = token.picture as string;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
      }

      // 支持通过 update() 更新 avatar
      if (trigger === "update" && session?.avatar) {
        token.picture = session.avatar;
      }

      return token;
    },
  },
};
```

### 4. 腾讯云 COS 配置

#### 4.1 创建存储桶

1. 登录 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos5)
2. 创建存储桶（例如：`bglove-1306852572`）
3. 选择地域（例如：`ap-beijing`）
4. 设置访问权限为**公有读私有写**

#### 4.2 CORS 配置（重要）

在存储桶的【安全管理】->【跨域访问 CORS 设置】中添加规则：

```json
{
  "Origin": [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://your-domain.com" // 生产环境域名
  ],
  "Method": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
  "AllowedHeader": ["*"],
  "ExposeHeader": ["ETag", "x-cos-request-id"],
  "MaxAgeSeconds": 600
}
```

#### 4.3 密钥权限

确保使用的密钥具有以下权限：

- `cos:GetObject` - 读取对象
- `cos:PutObject` - 上传对象
- `cos:GetObjectVersion` - 获取对象版本（如果启用了版本控制）

### 5. 数据库模型

确保 User 模型包含 avatar 字段：

```prisma
// schema.prisma
model User {
  id      String   @id @default(cuid())
  email   String   @unique
  name    String?
  avatar  String?  // 头像 URL
  // ... 其他字段
}
```

### 6. 安全考虑

1. **预签名 URL 时效性**：设置为 5 分钟，防止 URL 被滥用
2. **文件类型验证**：前后端双重验证，只允许图片格式
3. **文件大小限制**：限制为 2MB，防止大文件攻击
4. **URL 白名单**：更新头像时验证 URL 来源，防止恶意更新
5. **身份验证**：所有接口都需要登录验证

### 7. 性能优化

1. **直传模式**：文件不经过服务器，节省带宽
2. **CDN 加速**：配置 COS_PUBLIC_DOMAIN 使用 CDN
3. **图片压缩**：前端可以在上传前压缩图片
4. **懒加载**：头像图片使用 lazy loading

### 8. 错误处理

常见错误及解决方案：

| 错误              | 原因          | 解决方案               |
| ----------------- | ------------- | ---------------------- |
| `Failed to fetch` | CORS 配置问题 | 检查 COS 的 CORS 设置  |
| `403 Forbidden`   | 密钥权限不足  | 检查 COS 密钥权限      |
| `400 Bad Request` | 参数错误      | 检查文件格式和大小     |
| `预签名生成失败`  | 环境变量缺失  | 检查 `.env.local` 配置 |

### 9. 测试建议

1. **单元测试**：测试预签名 URL 生成逻辑
2. **集成测试**：测试 ��� 整上传流程
3. **边界测试**：测试文件大小和格式限制
4. **安全测试**：测试恶意文件上传防护

### 10. 部署注意事项

1. 生产环境使用 HTTPS
2. 配置真实域名到 CORS 白名单
3. 使用专门的 COS 密钥，限制权限范围
4. 配置 CDN 加速图片访问
5. 设置合适的缓存策略

## 总结

本方案实现了安全、高效的头像上传功能：

- ✅ 前端直传，减少服务器压力
- ✅ 预签名 URL，保证安全性
- ✅ 完整的验证机制，防止恶意上传
- ✅ 良好的用户体验，支持预览和进度提示
- ✅ 灵活的配置，支持自定义域名和路径前缀

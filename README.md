# 提示词分享平台

一个支持在AI聊天页面快速插入提示词，并提供提示词分享社区的全栈应用。

## 功能特性

- 🚀 浏览器扩展支持，在ChatGPT、Claude等AI页面快速插入提示词
- 📝 提示词管理（CRUD、标签、版本历史）
- 🌟 社交功能（点赞、评论、Fork）
- 🔍 搜索与发现（标签、分类、热门推荐）
- 👥 用户系统（邮箱/微信登录）
- 🛡️ 内容审核系统
- 📊 管理后台

## 技术栈

- **前端**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **后端**: Next.js API Routes, Prisma, NextAuth
- **数据库**: MySQL
- **存储**: 腾讯云COS
- **扩展**: Chrome MV3

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd prompt-sharing-platform
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置以下变量：
```env
# 数据库配置
DATABASE_URL="mysql://username:password@localhost:3306/prompt_sharing"

# NextAuth配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# 微信OAuth配置（可选）
WECHAT_CLIENT_ID=""
WECHAT_CLIENT_SECRET=""

# 腾讯云COS配置
COS_SECRET_ID=""
COS_SECRET_KEY=""
COS_BUCKET=""
COS_REGION="ap-beijing"
```

4. 初始化数据库
```bash
npm run db:push  # 创建数据库表
npm run db:seed  # 插入种子数据
```

5. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
prompt-sharing-platform/
├── prisma/           # 数据库配置和迁移
├── public/           # 静态资源
├── src/
│   ├── app/          # App Router页面
│   │   ├── (auth)/   # 认证相关页面
│   │   ├── (app)/    # 主应用页面
│   │   ├── admin/    # 管理后台
│   │   └── api/      # API路由
│   ├── components/   # 组件
│   ├── lib/          # 工具库
│   ├── types/        # 类型定义
│   └── utils/        # 工具函数
└── extension/        # Chrome扩展（后续添加）
```

## 开发指南

### 数据库命令

```bash
npm run db:generate   # 生成Prisma客户端
npm run db:push       # 推送schema到数据库
npm run db:migrate    # 运行迁移
npm run db:studio     # 打开Prisma Studio
```

### 构建和部署

```bash
npm run build    # 构建生产版本
npm start        # 启动生产服务器
```

## 账号信息

管理员账号（种子数据）：
- 邮箱：admin@example.com
- 密码：admin123

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT

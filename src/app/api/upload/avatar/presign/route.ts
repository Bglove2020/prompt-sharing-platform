import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCosClient, buildAvatarObjectKey, getPublicCosUrl } from "@/lib/cos";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  let body: { filename?: string; mimeType?: string; size?: number } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体错误" }, { status: 400 });
  }

  const { filename = "avatar.png", mimeType = "image/png", size = 0 } = body;

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json({ message: "仅支持 jpeg/png/webp 图片" }, { status: 400 });
  }
  if (size > MAX_SIZE) {
    return NextResponse.json({ message: "图片不能超过 2MB" }, { status: 400 });
  }

  try {
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
          Expires: 300,
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

    const avatarUrl = getPublicCosUrl(Key);

    return NextResponse.json({
      uploadUrl,
      avatarUrl,
      objectKey: Key,
      expiresIn: 300,
      headers: { "Content-Type": mimeType },
    });
  } catch (error) {
    console.error("[avatar presign] error", error);
    return NextResponse.json({ message: "生成上传凭证失败" }, { status: 500 });
  }
}


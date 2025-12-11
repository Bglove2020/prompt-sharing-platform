import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ALLOWED_DOMAINS = [
  process.env.COS_PUBLIC_DOMAIN,
  process.env.COS_BUCKET && process.env.COS_REGION
    ? `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com`
    : undefined,
].filter(Boolean) as string[];

function isAllowedUrl(url: string) {
  if (!ALLOWED_DOMAINS.length) return true; // 若未配置域名白名单，则不限制
  return ALLOWED_DOMAINS.some((domain) => url.startsWith(domain));
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  let body: { avatarUrl?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体错误" }, { status: 400 });
  }

  const { avatarUrl } = body;
  if (!avatarUrl) {
    return NextResponse.json({ message: "缺少 avatarUrl" }, { status: 400 });
  }

  if (!isAllowedUrl(avatarUrl)) {
    return NextResponse.json({ message: "头像地址不被允许" }, { status: 400 });
  }

  try {
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


import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ACTIVE_SENTINEL } from "@/lib/constants";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action === "decrement" ? "decrement" : "increment";

    const post = await prisma.post.findFirst({
      where: { id: params.id, status: "active", deletedAt: ACTIVE_SENTINEL },
    });

    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    const updated = await prisma.post.update({
      where: { id: params.id },
      data:
        action === "increment"
          ? { likeCount: { increment: 1 } }
          : { likeCount: Math.max(0, post.likeCount - 1) },
    });

    return NextResponse.json({
      data: { likeCount: updated.likeCount },
      action,
    });
  } catch (error) {
    console.error("Error updating like count:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

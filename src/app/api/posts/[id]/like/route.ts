import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ACTIVE_SENTINEL } from "@/lib/constants";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: {
      email_deletedAt: {
        email: session.user.email,
        deletedAt: ACTIVE_SENTINEL,
      },
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action === "decrement" ? "decrement" : "increment";

    const post = await prisma.post.findFirst({
      where: { id: params.id, status: "active", deletedAt: ACTIVE_SENTINEL },
      select: { id: true, likeCount: true },
    });

    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    const likeWhere = {
      postId_userId: { postId: params.id, userId: user.id },
    };

    const existingLike = await prisma.postLike.findUnique({ where: likeWhere });

    if (action === "increment") {
      if (existingLike) {
        return NextResponse.json({
          data: { likeCount: post.likeCount, isLiked: true },
          action,
        });
      }

      const [, updatedPost] = await prisma.$transaction([
        prisma.postLike.create({
          data: { postId: params.id, userId: user.id },
        }),
        prisma.post.update({
          where: { id: params.id },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        }),
      ]);

      return NextResponse.json({
        data: { likeCount: updatedPost.likeCount, isLiked: true },
        action,
      });
    }

    // action === "decrement"
    if (!existingLike) {
      return NextResponse.json({
        data: { likeCount: post.likeCount, isLiked: false },
        action,
      });
    }

    const [, updatedPost] = await prisma.$transaction([
      prisma.postLike.delete({ where: likeWhere }),
      prisma.post.update({
        where: { id: params.id },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      }),
    ]);

    return NextResponse.json({
      data: { likeCount: Math.max(updatedPost.likeCount, 0), isLiked: false },
      action,
    });
  } catch (error) {
    console.error("Error updating like count:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

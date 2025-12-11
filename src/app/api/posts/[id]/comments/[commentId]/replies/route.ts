import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ACTIVE_SENTINEL } from "@/lib/constants";

/**
 * 获取某个评论的所有直接回复（支持无限嵌套）
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { commentId } = params;

    // 验证父评论是否存在
    const parentComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        deletedAt: ACTIVE_SENTINEL,
      },
    });

    if (!parentComment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    // 获取所有回复
    const replies = await prisma.comment.findMany({
      where: {
        parentCommentId: commentId,
        deletedAt: ACTIVE_SENTINEL,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      data: replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        author: reply.author,
        likeCount: reply.likeCount,
        replyCount: reply.replyCount,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching replies:", error);
    return NextResponse.json({ error: "获取回复失败" }, { status: 500 });
  }
}

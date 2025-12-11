import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ACTIVE_SENTINEL } from "@/lib/constants";
import { createCommentSchema } from "@/lib/validation/comment";

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

/**
 * 获取帖子的评论列表
 * 返回一级评论（parentCommentId为null），每个一级评论包含replyCount
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // 验证帖子是否存在
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        status: "active",
        deletedAt: ACTIVE_SENTINEL,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    // 获取一级评论（parentCommentId为null）
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null,
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
        createdAt: "desc",
      },
    });

    // 获取每个评论的回复数量
    const commentsWithReplyCount = await Promise.all(
      comments.map(async (comment) => {
        const replyCount = await prisma.comment.count({
          where: {
            parentCommentId: comment.id,
            deletedAt: ACTIVE_SENTINEL,
          },
        });

        return {
          id: comment.id,
          content: comment.content,
          author: comment.author,
          likeCount: comment.likeCount,
          replyCount,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        };
      })
    );

    return NextResponse.json({
      data: commentsWithReplyCount,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
  }
}

/**
 * 创建评论
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCommentSchema.safeParse({
      ...body,
      postId: params.id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "参数错误" },
        { status: 400 }
      );
    }

    const { content, parentCommentId } = parsed.data;

    // 验证帖子是否存在
    const post = await prisma.post.findFirst({
      where: {
        id: params.id,
        status: "active",
        deletedAt: ACTIVE_SENTINEL,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    // 如果是指定父评论的回复，验证父评论是否存在
    if (parentCommentId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: parentCommentId,
          postId: params.id,
          deletedAt: ACTIVE_SENTINEL,
        },
      });

      if (!parentComment) {
        return NextResponse.json({ error: "父评论不存在" }, { status: 404 });
      }
    }

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: user.id,
        postId: params.id,
        parentCommentId: parentCommentId || null,
        ancestorCommentId: parentCommentId || "0",
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
    });

    // 如果是回复，更新父评论的回复数
    if (parentCommentId) {
      await prisma.comment.update({
        where: { id: parentCommentId },
        data: {
          replyCount: {
            increment: 1,
          },
        },
      });
    }

    // 更新帖子的评论数
    await prisma.post.update({
      where: { id: params.id },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      data: {
        id: comment.id,
        content: comment.content,
        author: comment.author,
        likeCount: comment.likeCount,
        replyCount: 0,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "创建评论失败" }, { status: 500 });
  }
}

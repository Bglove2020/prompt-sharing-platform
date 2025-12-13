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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    const post = await prisma.post.findFirst({
      where: { id: params.id, deletedAt: ACTIVE_SENTINEL },
      select: {
        id: true,
        status: true,
        title: true,
        description: true,
        content: true,
        tags: true,
        likeCount: true,
        commentCount: true,
        forkCount: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    if (post.status != "active") {
      if (user?.id !== post.author.id) {
        return NextResponse.json(
          { error: "隐藏资源，无权限访问" },
          { status: 403 }
        );
      }
    }

    const isLiked = user
      ? Boolean(
          await prisma.postLike.findUnique({
            where: { postId_userId: { postId: post.id, userId: user.id } },
          })
        )
      : false;

    return NextResponse.json({
      data: {
        id: post.id,
        title: post.title,
        description: post.description,
        content: post.content,
        author: post.author,
        tags: post.tags,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        forkCount: post.forkCount,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isLiked,
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "获取帖子失败" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const existing = await prisma.post.findFirst({
      where: {
        id: params.id,
        authorId: user.id,
        deletedAt: ACTIVE_SENTINEL,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "帖子不存在或无权限" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, content, tags, status } = body;

    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (content !== undefined) data.content = content;
    if (tags !== undefined) data.tags = tags;
    if (status !== undefined) {
      if (status === "active" || status === "hidden") {
        data.status = status;
      }
    }

    const updated = await prisma.post.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        tags: true,
        status: true,
        likeCount: true,
        commentCount: true,
        forkCount: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        content: updated.content,
        author: updated.author,
        tags: updated.tags,
        status: updated.status,
        likeCount: updated.likeCount,
        commentCount: updated.commentCount,
        forkCount: updated.forkCount,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "更新帖子失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const existing = await prisma.post.findFirst({
      where: {
        id: params.id,
        authorId: user.id,
        deletedAt: ACTIVE_SENTINEL,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "帖子不存在或无权限" },
        { status: 404 }
      );
    }

    await prisma.post.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "帖子已删除" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "删除帖子失败" }, { status: 500 });
  }
}

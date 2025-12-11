import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ACTIVE_SENTINEL } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email_deletedAt: {
          email: session.user.email,
          deletedAt: ACTIVE_SENTINEL,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const where: any = {
      authorId: user.id,
      deletedAt: ACTIVE_SENTINEL,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    const total = await prisma.post.count({ where });

    return NextResponse.json({
      data: posts.map((post) => ({
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
        authorId: post.authorId,
        avatar: post.author.avatar,
        name: post.author.name,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json({ error: "获取帖子失败" }, { status: 500 });
  }
}

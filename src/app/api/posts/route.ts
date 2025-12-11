import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ACTIVE_SENTINEL } from "@/lib/constants";
import { createPostSchema } from "@/lib/validation/post";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  console.log("session", session);
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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort") || "latest";
    const search = searchParams.get("search");

    console.log(searchParams);

    const where: any = {
      status: "active",
      deletedAt: ACTIVE_SENTINEL,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { content: { contains: search } },
      ];
    }

    if (tag) {
      where.tags = { contains: tag };
    }
    console.log("where", where);

    let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
    if (sort === "popular") {
      orderBy = { likeCount: "desc" };
    } else if (sort === "most-forked") {
      orderBy = { forkCount: "desc" };
    }

    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy,
      skip,
      take: limit,
    });

    console.log("posts", posts);

    const total = await prisma.post.count({ where });

    let likedSet = new Set<string>();
    if (user && posts.length > 0) {
      const liked = await prisma.postLike.findMany({
        where: { userId: user.id, postId: { in: posts.map((p) => p.id) } },
        select: { postId: true },
      });
      likedSet = new Set(liked.map((item) => item.postId));
    }

    const payload = posts.map((post) => ({
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
      isLiked: likedSet.has(post.id),
    }));

    return NextResponse.json({
      data: payload,
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
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "获取帖子失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    console.log("user", user);
    const body = await request.json();

    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      console.log(parsed.error.issues);
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "参数校验失败" },
        { status: 400 }
      );
    }

    const { title, content, description, tags } = parsed.data;

    const post = await prisma.post.create({
      data: {
        title,
        description,
        content,
        authorId: user.id,
        status: "active",
        type: "background",
        deletedAt: ACTIVE_SENTINEL,
        tags: tags,
      },
    });

    return NextResponse.json({
      msg: "创建成功",
      code: 200,
      data: {
        id: post.id,
      },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "创建帖子失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, content, tags } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少帖子ID" }, { status: 400 });
    }

    const existing = await prisma.post.findFirst({
      where: {
        id,
        authorId: user.id,
        status: "active",
        deletedAt: ACTIVE_SENTINEL,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "帖子不存在或无权限" },
        { status: 404 }
      );
    }

    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (content !== undefined) data.content = content;

    if (tags !== undefined) data.tags = tags;

    const updated = await prisma.post.update({
      where: { id },
      data,
      include: {
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

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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
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

    const prompts = await prisma.prompt.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.prompt.count({ where });

    return NextResponse.json({
      data: prompts,
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
    console.error("Error fetching prompts:", error);
    return NextResponse.json({ error: "获取提示词失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, description, type } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容为必填项" },
        { status: 400 }
      );
    }

    const prompt = await prisma.prompt.create({
      data: {
        title,
        content,
        description,
        type: type || "BACKGROUND",
        authorId: user.id,
        deletedAt: ACTIVE_SENTINEL,
      },
    });

    return NextResponse.json({ data: prompt });
  } catch (error) {
    console.error("Error creating prompt:", error);
    return NextResponse.json({ error: "创建提示词失败" }, { status: 500 });
  }
}

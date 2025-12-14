import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ACTIVE_SENTINEL } from "@/lib/constants";

// 标记为动态路由，因为使用了 getServerSession (内部使用 headers)
export const dynamic = "force-dynamic";

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

    const prompts = await prisma.prompt.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.prompt.count({ where });

    // 配置跨域：为响应添加 CORS 头
    const response = NextResponse.json({
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
    response.headers.set(
      "Access-Control-Allow-Origin",
      "https://chat.deepseek.com"
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-CSRF-Token"
    );
    // 可以根据需要添加其他 CORS 头
    return response;
  } catch (error) {
    console.error("Error fetching user prompts:", error);
    return NextResponse.json({ error: "获取提示词失败" }, { status: 500 });
  }
}

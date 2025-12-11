import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ACTIVE_SENTINEL } from "@/lib/constants";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return await prisma.user.findUnique({
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
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const prompt = await prisma.prompt.findFirst({
      where: {
        id: params.id,
        authorId: user.id,
        deletedAt: ACTIVE_SENTINEL,
      },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "提示词不存在或无权访问" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: prompt });
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return NextResponse.json({ error: "获取提示词失败" }, { status: 500 });
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

    const existing = await prisma.prompt.findFirst({
      where: {
        id: params.id,
        authorId: user.id,
        deletedAt: ACTIVE_SENTINEL,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "提示词不存在或无权访问" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, description, type } = body;

    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;

    const updated = await prisma.prompt.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating prompt:", error);
    return NextResponse.json({ error: "更新提示词失败" }, { status: 500 });
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

    const existing = await prisma.prompt.findFirst({
      where: {
        id: params.id,
        authorId: user.id,
        deletedAt: ACTIVE_SENTINEL,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "提示词不存在或无权访问" },
        { status: 404 }
      );
    }

    await prisma.prompt.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "提示词已删除" });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return NextResponse.json({ error: "删除提示词失败" }, { status: 500 });
  }
}

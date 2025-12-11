import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { loginSchema } from "@/lib/validation/auth";
import prisma from "@/lib/prisma";
import { ACTIVE_SENTINEL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    // 查找用户 - 需要包含 deletedAt 参数因为使用了复合唯一索引
    const user = await prisma.user.findUnique({
      where: {
        email_deletedAt: {
          email,
          deletedAt: ACTIVE_SENTINEL,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        password: true,
        status: true,
      },
    });
    console.log(user);

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 400 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "账号已被禁用" }, { status: 400 });
    }

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: "登录成功",
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Login error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

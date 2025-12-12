import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import { registerSchema } from "@/lib/validation/auth";
import prisma from "@/lib/prisma";
import { ACTIVE_SENTINEL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      console.log(parsed.error);
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }

    const { email, password, name, phone } = parsed.data;

    // 检查邮箱是否已存在（使用复合唯一索引）
    const existingUserByEmail = await prisma.user.findUnique({
      where: {
        email_deletedAt: {
          email,
          deletedAt: ACTIVE_SENTINEL,
        },
      },
      select: { id: true },
    });

    if (existingUserByEmail) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    // 如果提供了手机号，检查手机号是否已存在（使用复合唯一索引）
    if (phone) {
      const existingUserByPhone = await prisma.user.findUnique({
        where: {
          phone_deletedAt: {
            phone,
            deletedAt: ACTIVE_SENTINEL,
          },
        },
        select: { id: true },
      });

      if (existingUserByPhone) {
        return NextResponse.json(
          { error: "该手机号已被注册" },
          { status: 400 }
        );
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name,
        phone: phone ?? undefined,
        deletedAt: ACTIVE_SENTINEL,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "注册成功",
      user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "参数不合法" },
        { status: 400 }
      );
    }

    console.error("Register error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

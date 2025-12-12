import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 标记为动态路由，因为使用了 getServerSession (内部使用 headers)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log("Test auth API - session:", session);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          error: "未认证",
          session: session,
          hasSession: !!session,
          hasUser: !!session?.user
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "认证成功",
      user: session.user,
      userId: session.user.id,
    });
  } catch (error) {
    console.error("Test auth error:", error);
    return NextResponse.json(
      { error: "服务器错误", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
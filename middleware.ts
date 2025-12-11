import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    console.log("middleware called", req);
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    console.log("middleware called", {
      token: !!token,
      userId: token?.id,
      pathname,
    });

    // 排除 NextAuth 的路由，这些路由不需要认证
    if (pathname.startsWith("/api/auth/")) {
      return NextResponse.next();
    }

    // 如果没有 token，需要认证
    if (!token) {
      // API 路由返回 JSON 错误（API 调用不能重定向）
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "请先登录", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }

      // 页面路由重定向到登录页，携带 callbackUrl 和错误消息参数
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("error", "请先登录以访问此页面");
      return NextResponse.redirect(loginUrl);
    }

    // 有 token，继续执行
    return NextResponse.next();
  },
  {
    callbacks: {
      // 始终返回 true，让所有请求都进入中间件函数，由中间件函数统一处理
      // 这样可以在中间件函数中自定义重定向逻辑（添加 error 参数等）
      authorized: () => {
        console.log("authorized callback");
        return true;
      },
    },
    pages: {
      signIn: "/login", // 未登录时重定向到登录页
    },
  }
);

// 配置需要保护的路由
export const config = {
  matcher: [
    // 保护页面路由
    "/posts/:path*", // 保护所有 /prompts 下的路由（包括 /prompts, /prompts/new, /prompts/[id] 等）
    "/me/:path*", // 保护所有 /me 下的路由

    // 保护需要认证的 API 路由
    "/api/user/:path*", // 保护所有 /api/user 下的路由
    "/api/prompts/:path*", // 保护所有 /api/prompts 下的路由（GET 请求在中间件中特殊处理）
    // 注意：/api/auth/* 保持公开，因为这是 NextAuth 的路由
  ],
};

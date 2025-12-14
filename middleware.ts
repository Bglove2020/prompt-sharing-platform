import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 允许的源列表（如果需要限制特定域名，可以在这里配置）
// 如果为空数组，则允许所有源（动态返回请求的 origin）
const allowedOrigins: string[] = [
  "https://chat.deepseek.com",
  // "https://yourdomain.com",
  // 可以添加更多允许的源
];

// 允许的请求头列表（携带 credentials 时不能使用 *）
const allowedHeaders = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Accept",
  "Origin",
  "Cache-Control",
  "X-CSRF-Token",
].join(", ");

// 允许的请求方法列表
const allowedMethods = "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD";

// 获取 CORS 响应头 - 写死测试版本
function getCorsHeaders(request: NextRequest) {
  // 直接写死，测试中间件是否生效
  return {
    "Access-Control-Allow-Origin": "https://chat.deepseek.com",
    "Access-Control-Allow-Methods": allowedMethods,
    "Access-Control-Allow-Headers": allowedHeaders,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// 处理 OPTIONS 预检请求
function handleOptions(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// 为响应添加 CORS 头
function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export default withAuth(
  function middleware(req) {
    // 处理 OPTIONS 预检请求
    if (req.method === "OPTIONS") {
      return handleOptions(req);
    }

    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // 定义不需要认证的公开路由
    const publicRoutes = [
      "/api/auth/", // NextAuth 路由
      // 可以在这里添加其他公开的 API 路由
    ];

    // 检查是否为公开路由
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // 如果是公开路由，直接通过并添加 CORS 头
    if (isPublicRoute) {
      const response = NextResponse.next();
      return addCorsHeaders(response, req);
    }

    // 定义需要认证的路由
    const protectedRoutes = ["/posts/", "/me/", "/api/user/", "/api/prompts/"];

    // 检查是否为需要认证的路由
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // 如果是需要认证的路由但没有 token
    if (isProtectedRoute && !token) {
      // API 路由返回 JSON 错误（API 调用不能重定向）
      if (pathname.startsWith("/api/")) {
        const response = NextResponse.json(
          { error: "请先登录", code: "UNAUTHORIZED" },
          { status: 401 }
        );
        return addCorsHeaders(response, req);
      }

      // 页面路由重定向到登录页，携带 callbackUrl 和错误消息参数
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("error", "请先登录以访问此页面");
      const response = NextResponse.redirect(loginUrl);
      return addCorsHeaders(response, req);
    }

    // 其他路由（公开页面路由等）直接通过并添加 CORS 头
    const response = NextResponse.next();
    return addCorsHeaders(response, req);
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
// 为了确保所有路由都有 CORS 头，我们匹配所有路由
// 但认证逻辑仍然只应用于需要保护的路由
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - api (API 路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon 文件)
     * - 公开的静态资源
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

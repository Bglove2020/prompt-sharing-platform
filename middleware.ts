import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 允许的源列表（如果需要限制特定域名，可以在这里配置）
// 如果为空数组，则允许所有源（动态返回请求的 origin）
const allowedOrigins: string[] = [
  // "https://chat.deepseek.com",
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

// 获取 CORS 响应头
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");

  // 动态返回请求的 origin（支持携带 credentials）
  // 如果配置了 allowedOrigins，则检查是否在白名单中
  // 如果没有配置（空数组），则允许所有 origin
  let allowOrigin: string | null = null;

  if (origin) {
    if (allowedOrigins.length > 0) {
      // 配置了白名单，检查 origin 是否在白名单中
      if (allowedOrigins.includes(origin)) {
        allowOrigin = origin;
      }
      // 如果不在白名单中，allowOrigin 保持为 null，后面会处理
    } else {
      // 没有配置白名单，允许所有 origin（动态返回请求的 origin）
      allowOrigin = origin;
    }
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": allowedMethods,
    "Access-Control-Allow-Headers": allowedHeaders,
    "Access-Control-Max-Age": "86400", // 24 小时
  };

  // 设置 Access-Control-Allow-Origin
  // 携带 credentials 时必须返回具体的 origin，不能使用 *
  if (allowOrigin) {
    // 有允许的 origin（在白名单中或允许所有源）
    headers["Access-Control-Allow-Origin"] = allowOrigin;
    headers["Access-Control-Allow-Credentials"] = "true";
    // 当动态返回 origin 时，需要设置 Vary 头，告诉浏览器响应会根据 Origin 变化
    headers["Vary"] = "Origin";
  } else if (origin && allowedOrigins.length > 0) {
    // 有 origin 但不在白名单中，不设置 Access-Control-Allow-Origin（拒绝跨域请求）
    // 这种情况下不添加 Access-Control-Allow-Origin，浏览器会拒绝请求
    // 这是安全的行为：如果配置了白名单，只允许白名单中的源
    // 但仍然设置其他 CORS 头，以便调试
  } else {
    // 没有 origin 的请求（如同源请求或服务端请求）
    // 或者允许所有源但当前请求没有 origin 头
    // 对于这种情况，设置 * 以支持基本 CORS
    // 注意：使用 * 时不能设置 Access-Control-Allow-Credentials
    headers["Access-Control-Allow-Origin"] = "*";
    // 不设置 Access-Control-Allow-Credentials，因为使用了 *
  }

  return headers;
}

// 处理 OPTIONS 预检请求
function handleOptions(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  // 调试：在开发环境中记录 OPTIONS 请求
  if (process.env.NODE_ENV === "development") {
    console.log("[CORS] 处理 OPTIONS 预检请求:", {
      path: request.nextUrl.pathname,
      origin: request.headers.get("origin"),
      headers: corsHeaders,
    });
  }

  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// 为响应添加 CORS 头
function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  // 确保所有 CORS 头都被设置
  Object.entries(corsHeaders).forEach(([key, value]) => {
    if (value) {
      // 使用 append 而不是 set，确保头不会被覆盖
      response.headers.set(key, value);
    }
  });

  // 调试：在开发环境中记录 CORS 头
  if (process.env.NODE_ENV === "development") {
    const origin = request.headers.get("origin");
    console.log("[CORS] 添加 CORS 头:", {
      path: request.nextUrl.pathname,
      method: request.method,
      origin: origin || "(无 origin，同源请求)",
      "Access-Control-Allow-Origin":
        corsHeaders["Access-Control-Allow-Origin"] || "(未设置)",
      "Access-Control-Allow-Credentials":
        corsHeaders["Access-Control-Allow-Credentials"] || "(未设置)",
      allHeaders: corsHeaders,
    });
  }

  return response;
}

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const method = req.method;

    // 调试日志
    if (process.env.NODE_ENV === "development") {
      console.log(`[Middleware] ${method} ${pathname}`);
    }

    // 处理 OPTIONS 预检请求（必须在最前面处理）
    if (method === "OPTIONS") {
      return handleOptions(req);
    }

    const token = req.nextauth.token;

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
// 为了确保所有路由都有 CORS 头，我们匹配所有路由（包括 API 路由）
// 但认证逻辑仍然只应用于需要保护的路由
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，包括 API 路由，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon 文件)
     * - 公开的静态资源
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

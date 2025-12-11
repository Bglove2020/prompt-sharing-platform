import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

/**
 * Next.js 中间件中可以访问的数据示例
 * 
 * 注意：这个文件仅用于演示，实际项目请使用 middleware.ts
 */

export default withAuth(
  function middleware(req: NextRequest & { nextauth?: { token?: any } }) {
    // ============================================
    // 1. 请求基本信息
    // ============================================
    
    // HTTP 方法
    const method = req.method; // 'GET', 'POST', 'PUT', 'DELETE' 等
    
    // 请求 URL 对象（扩展了原生 URL API）
    const url = req.url; // 完整 URL 字符串
    const nextUrl = req.nextUrl; // Next.js URL 对象
    
    // ============================================
    // 2. URL 相关信息（通过 nextUrl 访问）
    // ============================================
    
    // 路径名（不包含查询参数）
    const pathname = req.nextUrl.pathname; // '/prompts/123'
    
    // 查询参数（URLSearchParams 对象）
    const searchParams = req.nextUrl.searchParams;
    const queryParam = searchParams.get('key'); // 获取单个参数
    const allParams = Object.fromEntries(searchParams); // 获取所有参数
    
    // 基础路径（如果配置了 basePath）
    const basePath = req.nextUrl.basePath; // '/blog' 或 ''
    
    // 完整 URL 对象
    const fullUrl = req.nextUrl.href; // 'https://example.com/prompts?key=value'
    
    // 主机名
    const hostname = req.nextUrl.hostname; // 'example.com'
    
    // 端口
    const port = req.nextUrl.port; // '3000' 或 ''
    
    // 协议
    const protocol = req.nextUrl.protocol; // 'https:' 或 'http:'
    
    // 路径 + 查询字符串
    const pathnameWithSearch = req.nextUrl.pathname + req.nextUrl.search;
    
    // ============================================
    // 3. 请求头（Headers）
    // ============================================
    
    // 获取所有请求头
    const headers = req.headers;
    
    // 获取特定请求头
    const userAgent = req.headers.get('user-agent'); // 用户代理
    const referer = req.headers.get('referer'); // 来源页面
    const acceptLanguage = req.headers.get('accept-language'); // 语言偏好
    const authorization = req.headers.get('authorization'); // 认证头
    const contentType = req.headers.get('content-type'); // 内容类型
    
    // 获取所有请求头（作为对象）
    const headersObject = Object.fromEntries(req.headers.entries());
    
    // 检查请求头是否存在
    const hasCustomHeader = req.headers.has('x-custom-header');
    
    // ============================================
    // 4. Cookies
    // ============================================
    
    // 获取所有 cookies
    const cookies = req.cookies;
    
    // 获取特定 cookie
    const sessionCookie = req.cookies.get('next-auth.session-token');
    const customCookie = req.cookies.get('custom-cookie');
    
    // 获取所有 cookie 值（作为对象）
    const cookiesObject = Object.fromEntries(
      req.cookies.getAll().map(c => [c.name, c.value])
    );
    
    // 检查 cookie 是否存在
    const hasSession = req.cookies.has('next-auth.session-token');
    
    // ============================================
    // 5. NextAuth 相关数据（使用 withAuth 时）
    // ============================================
    
    // JWT Token（如果用户已登录）
    const token = req.nextauth?.token;
    
    // Token 中的用户信息
    const userId = token?.id;
    const userEmail = token?.email;
    const userName = token?.name;
    
    // ============================================
    // 6. IP 地址和地理位置（Vercel 部署时）
    // ============================================
    
    // 客户端 IP 地址
    const ip = req.ip || 
               req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';
    
    // 地理位置信息（如果配置了）
    const geo = req.geo; // { city, region, country, latitude, longitude }
    const country = req.geo?.country;
    const city = req.geo?.city;
    
    // ============================================
    // 7. 请求体（注意：中间件中通常不读取请求体）
    // ============================================
    
    // ⚠️ 注意：中间件在 Edge Runtime 中运行，通常不读取请求体
    // 如果需要读取请求体，应该在 API 路由中处理
    // const body = await req.json(); // 不推荐在中间件中使用
    
    // ============================================
    // 8. 实际使用示例
    // ============================================
    
    // 示例 1: 基于路径的访问控制
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
    
    // 示例 2: 基于地理位置的访问控制
    if (country === 'CN' && pathname.startsWith('/restricted')) {
      return NextResponse.redirect(new URL('/blocked', req.url));
    }
    
    // 示例 3: 基于 User-Agent 的访问控制
    if (userAgent?.includes('bot') && pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Bots not allowed' }, { status: 403 });
    }
    
    // 示例 4: 添加自定义请求头
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', userId || 'anonymous');
    requestHeaders.set('x-user-country', country || 'unknown');
    
    // 示例 5: 设置响应头
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    response.headers.set('x-middleware-processed', 'true');
    response.headers.set('x-request-time', new Date().toISOString());
    
    // 示例 6: 基于查询参数的重定向
    if (searchParams.get('redirect') === 'true') {
      return NextResponse.redirect(new URL('/target', req.url));
    }
    
    // 示例 7: URL 重写（不改变浏览器显示的 URL）
    if (pathname === '/old-path') {
      return NextResponse.rewrite(new URL('/new-path', req.url));
    }
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 在 authorized 回调中也可以访问 req
        const pathname = req.nextUrl.pathname;
        const method = req.method;
        
        // 可以基于这些信息决定是否授权
        return !!token;
      },
    },
  }
);

// ============================================
// 9. 配置选项
// ============================================

export const config = {
  // 匹配器：指定哪些路由需要经过中间件
  matcher: [
    '/prompts/:path*',
    '/me/:path*',
    '/api/user/:path*',
  ],
  
  // 可选：指定运行区域（Vercel 部署时）
  // regions: ['iad1', 'sfo1'],
};


/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 允许腾讯云 COS 下任意 bucket 的图片域名
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cos.ap-beijing.myqcloud.com",
        pathname: "/**",
      },
    ],
  },
  // CORS 头现在由 middleware.ts 统一管理，支持动态 origin 和 credentials
  // async headers() {
  //   return [
  //     {
  //       source: "/:path*",
  //       headers: [
  //         {
  //           key: "Access-Control-Allow-Origin",
  //           value: "*",
  //         },
  //         {
  //           key: "Access-Control-Allow-Methods",
  //           value: "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
  //         },
  //         {
  //           key: "Access-Control-Allow-Headers",
  //           value: "*",
  //         },
  //         {
  //           key: "Access-Control-Max-Age",
  //           value: "86400",
  //         },
  //       ],
  //     },
  //   ];
  // },
};

module.exports = nextConfig;

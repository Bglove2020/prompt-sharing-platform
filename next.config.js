/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 允许腾讯云 COS 下任意 bucket 的图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cos.ap-beijing.myqcloud.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
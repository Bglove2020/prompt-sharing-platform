"use client";

import axios from "axios";
import { toast } from "sonner";

export class HttpError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_axiosClient_BASE_URL || "",
});

// axiosClient.interceptors.request.use((config) => {
//   // 从本地存储获取 token，统一挂载 Authorization
//   if (typeof window !== "undefined") {
//     const token = localStorage.getItem("token");
//     if (token && config.headers && !config.headers.Authorization) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   }
//   return config;
// });

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const message =
      (data && (data.error || data.message)) ||
      error?.message ||
      "请求失败，请稍后重试";

    // 401 错误：跳转到登录页，错误消息通过 URL 参数传递
    if (status === 401) {
      if (typeof window !== "undefined") {
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("error", "登录过期，请重新登录");
        // 保存当前路径作为回调地址
        if (window.location.pathname !== "/login") {
          loginUrl.searchParams.set("callbackUrl", window.location.pathname);
        }
        // 使用 replace 避免在历史记录中留下记录
        window.location.replace(loginUrl.toString());
      }
    } else {
      // 其他错误：统一在拦截器中显示 toast
      // 只在客户端环境显示，避免服务端渲染时出错
      if (typeof window !== "undefined") {
        // 根据状态码显示不同的错误提示
        let errorMessage = message;
        if (status === 403) {
          errorMessage = "没有权限执行此操作";
        } else if (status === 404) {
          errorMessage = "请求的资源不存在";
        } else if (status === 500) {
          errorMessage = "服务器错误，请稍后重试";
        } else if (status === 502 || status === 503 || status === 504) {
          errorMessage = "服务暂时不可用，请稍后重试";
        }
        toast.error(errorMessage);
      }
    }

    // 仍然抛出 HttpError，让前端可以 catch 来处理业务逻辑（如设置错误状态、跳转等）
    // 但不需要再显示 toast，因为已经在拦截器中统一处理了
    return Promise.reject(new HttpError(message, status, data));
  }
);

export { axiosClient };

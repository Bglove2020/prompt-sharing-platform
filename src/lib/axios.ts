"use client";

import axios from "axios";

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
    return Promise.reject(new HttpError(message, status, data));
  }
);

export { axiosClient };

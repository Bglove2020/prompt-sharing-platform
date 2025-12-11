"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingOverlay,
} from "@/components/ui";
import { axiosClient, HttpError } from "@/lib/axios";
import { loginSchema, type LoginFormData } from "@/lib/validation/auth";
import { toast } from "sonner";
import { NavbarGuest } from "@/components/layout/navbar-guest";
import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 页面加载时检查是否有错误消息，显示 toast
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(error);
      // 清除 URL 参数，避免刷新时重复显示
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearErrors("root");
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      // 先调用自定义登录 API 验证凭据
      const response = await axiosClient.post("/api/auth/login", data);

      // 登录成功后，调用 NextAuth 的 signIn 来设置 session
      // 这样 middleware 就能检测到用户已登录
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("登录失败，请重试");
        setError("root", {
          type: "server",
          message: "登录失败，请重试",
        });
        return;
      }

      // 登录成功，显示成功消息
      const message = searchParams.get("message");
      if (message) {
        toast.success(message);
      } else {
        toast.success("登录成功");
      }

      // 跳转到应用首页或原目标页面
      const callbackUrl =
        (response?.data?.callbackUrl as string | undefined) ||
        searchParams.get("callbackUrl") ||
        "/posts";
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "网络错误，请稍后重试";
      toast.error(message);
      setError("root", {
        type: "server",
        message,
      });
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <NavbarGuest />
      <div className="flex items-center justify-center px-6 flex-1">
        <Card className="relative w-full max-w-md overflow-hidden">
          <LoadingOverlay show={isSubmitting} text="正在登录..." />
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">登录</CardTitle>
            <CardDescription className="text-center">
              使用您的账号登录 PromptHub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-md font-bold">
                  邮箱
                </Label>
                <Input
                  id="email"
                  placeholder="请输入邮箱"
                  {...register("email")}
                  className="text-md"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-md font-bold">
                  密码
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  {...register("password")}
                  className="text-md"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {errors.root && (
                <div className="text-sm text-destructive text-center">
                  {errors.root.message}
                </div>
              )}
              {searchParams.get("message") && (
                <div className="text-sm text-green-600 text-center">
                  {searchParams.get("message")}
                </div>
              )}
              <Button type="submit" className="w-full">
                登录
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">还没有账号？ </span>
              <Link href="/register" className="text-primary hover:underline">
                立即注册
              </Link>
            </div>
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    或
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" disabled>
                  微信登录（即将开放）
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

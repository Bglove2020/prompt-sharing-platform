"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { registerSchema, type RegisterFormData } from "@/lib/validation/auth";
import { toast } from "sonner";
import { NavbarGuest } from "@/components/layout/navbar-guest";

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    clearErrors("root");

    try {
      await axiosClient.post("/api/auth/register", {
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone || undefined,
        confirmPassword: data.confirmPassword,
      });

      toast.success("注册成功，请登录");
      router.push("/login");
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
          <LoadingOverlay show={isSubmitting} text="正在注册..." />
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">注册</CardTitle>
            <CardDescription className="text-center">
              创建您的 PromptHub 账号
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-md font-bold">
                  昵称
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="请输入昵称（可选）"
                  {...register("name")}
                  disabled={isSubmitting}
                  className="text-md"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-md font-bold">
                  邮箱
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  {...register("email")}
                  disabled={isSubmitting}
                  className="text-md"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-md font-bold">
                  手机号
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号（可选）"
                  {...register("phone")}
                  disabled={isSubmitting}
                  className="text-md"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
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
                  placeholder="请输入密码（至少8位）"
                  {...register("password")}
                  disabled={isSubmitting}
                  className="text-md"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-md font-bold">
                  确认密码
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  {...register("confirmPassword")}
                  disabled={isSubmitting}
                  className="text-md"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              {errors.root && (
                <div className="text-sm text-destructive text-center">
                  {errors.root.message}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "注册中..." : "注册"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">已有账号？ </span>
              <Link href="/login" className="text-primary hover:underline">
                立即登录
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
                  微信注册（即将开放）
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  LoadingOverlay,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { axiosClient, HttpError } from "@/lib/axios";
import { toast } from "sonner";
import {
  createPostFormSchema,
  type CreatePostFormData,
} from "@/lib/validation/post";

const PREFILL_KEY = "prefill-post-from-prompt";

export default function NewPostPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      title: "",
      content: "",
      description: "",
      status: "active",
      type: "background",
      tags: "",
    },
  });

  useEffect(() => {
    // 从 sessionStorage 读取预填数据，避免长 URL
    try {
      const raw = sessionStorage.getItem(PREFILL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CreatePostFormData>;
        reset({
          title: parsed.title ?? "",
          content: parsed.content ?? "",
          description: parsed.description ?? "",
          status: parsed.status ?? "active",
          type: parsed.type === "background" ? "background" : "background",
          tags: parsed.tags ?? "",
        });
        sessionStorage.removeItem(PREFILL_KEY);
      }
    } catch (err) {
      console.error("读取提示词预填数据失败", err);
    }
  }, [reset]);

  const onSubmit = async (data: CreatePostFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const result = await axiosClient.post("/api/posts", {
        title: data.title,
        content: data.content,
        description: data.description || undefined,
        status: data.status,
        tags: data.tags,
      });
      console.log("result", result);
      toast.success("帖子创建成功");
      router.push(`/me?tab=posts`);
    } catch (error) {
      // 错误已在拦截器中统一处理并显示 toast
    }
  };

  return (
    <>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 max-w-3xl">
        <div className="relative">
          <LoadingOverlay show={isSubmitting} text="正在创建帖子..." />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>创建新帖子</CardTitle>
                <CardDescription>
                  填写帖子的标题、描述、内容等信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 标题 */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-md font-bold">
                      标题
                    </Label>
                    <Input
                      id="title"
                      placeholder="请输入帖子标题"
                      {...register("title")}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* 描述 */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-md font-bold">
                      描述（可选）
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="请输入帖子描述"
                      rows={2}
                      {...register("description")}
                    />
                  </div>

                  {/* 内容 */}
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-md font-bold">
                      内容
                    </Label>
                    <Textarea
                      id="content"
                      placeholder="请输入帖子内容"
                      rows={4}
                      {...register("content")}
                    />
                    {errors.content && (
                      <p className="text-sm text-destructive">
                        {errors.content.message}
                      </p>
                    )}
                  </div>

                  {/* 状态 */}
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-md font-bold">
                      状态
                    </Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="请选择状态" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>状态</SelectLabel>
                              <SelectItem value="active">发布</SelectItem>
                              <SelectItem value="hidden">隐藏</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.status && (
                      <p className="text-sm text-destructive">
                        {errors.status.message}
                      </p>
                    )}
                  </div>

                  {/* 提示词类型 */}
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-md font-bold">
                      提示词类型
                    </Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="请选择提示词类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>提示词类型</SelectLabel>
                              <SelectItem value="background">
                                背景提示词
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.type && (
                      <p className="text-sm text-destructive">
                        {errors.type.message}
                      </p>
                    )}
                  </div>

                  {/* 标签 */}
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-md font-bold">
                      标签
                    </Label>
                    <Input
                      id="tags"
                      placeholder="用逗号分隔多个标签，如：编程, 效率工具, AI助手"
                      {...register("tags")}
                    />
                    {errors.tags && (
                      <p className="text-sm text-destructive">
                        {errors.tags.message}
                      </p>
                    )}
                  </div>

                  {/* 提交按钮 */}
                  <div className="flex justify-end">
                    <Button type="submit">创建帖子</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>
    </>
  );
}

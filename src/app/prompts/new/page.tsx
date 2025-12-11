"use client";

import { useState, useEffect } from "react";
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
import { promptSchema, type promptData } from "@/lib/validation/prompt";
import { cn } from "@/lib/utils";

export default function NewPromptPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<promptData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: "",
      content: "",
      description: "",
      type: "BACKGROUND",
    },
  });

  const onSubmit = async (data: promptData) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const result = await axiosClient.post(`/api/prompts`, {
        title: data.title,
        content: data.content,
        description: data.description || undefined,
        type: (data.type || "BACKGROUND").toUpperCase(),
      });

      toast.success("提示词保存成功");
      router.push(`/me`);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "保存提示词失败";
      toast.error(message);
    }
  };

  return (
    <>
      {/* Main Content */}
      <main className="container  mx-auto px-4 py-4 max-w-3xl flex-1 flex items-center justify-center">
        <div className="relative w-full">
          <LoadingOverlay show={isSubmitting} text="正在保存提示词..." />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>提示词</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 标题 */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className={cn("text-md font-bold")}>
                      标题
                    </Label>
                    <Input
                      id="title"
                      placeholder="请输入提示词标题"
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
                    <Label
                      htmlFor="description"
                      className={cn("text-md font-bold")}
                    >
                      描述（可选）
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="请输入提示词描述"
                      rows={2}
                      {...register("description")}
                    />
                  </div>

                  {/* 内容 */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="content"
                      className={cn("text-md font-bold")}
                    >
                      内容
                    </Label>
                    <Textarea
                      id="content"
                      placeholder="请输入提示词内容"
                      rows={4}
                      {...register("content")}
                    />
                    {errors.content && (
                      <p className="text-sm text-destructive">
                        {errors.content.message}
                      </p>
                    )}
                  </div>

                  {/* 提示词类型 */}
                  <div className="space-y-2">
                    <Label htmlFor="type" className={cn("text-md font-bold")}>
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

                  {/* 提交按钮 */}
                  <div className="flex justify-end">
                    <Button type="submit">添加</Button>
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

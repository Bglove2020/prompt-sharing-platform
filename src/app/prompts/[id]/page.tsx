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

export default function PromptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [canChange, setCanChange] = useState(false);
  // 获取 url 参数（id 参数）
  const [promptId, setPromptId] = useState<string | null>(params.id);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    // setIsLoading(true);
    if (!promptId) return;

    axiosClient
      .get(`/api/prompts/${promptId}`)
      .then((res) => {
        console.log("/api/prompts", res);
        // 使用 reset 方法一次性设置所有字段值，这会触发重新渲染并更新所有输入框
        //
        // 注意：setValue 默认不会触发组件重新渲染（这是 React Hook Form 的性能优化）
        // setValue 的选项（shouldValidate, shouldDirty, shouldTouch）只更新表单状态，不会让输入框显示新值
        // 如果必须使用 setValue，需要配合 watch() 或 useWatch() 来订阅字段变化：
        // setValue("title", res.data.title, { shouldValidate: true, shouldDirty: true })
        // 但推荐使用 reset() 来一次性设置多个字段
        reset({
          title: res.data?.title || "",
          content: res.data?.content || "",
          description: res.data?.description || "",
          type: res.data?.type || "BACKGROUND",
        });
      })
      .catch((error) => {
        console.error("获取提示词失败:", error);
        // 错误已在拦截器中统一处理并显示 toast
      })
      .finally(() => {
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件首次挂载时执行一次

  const onSubmit = async (data: promptData) => {
    if (!promptId) {
      toast.error("提示词ID不存在");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const result = await axiosClient.patch(`/api/prompts/${promptId}`, {
        title: data.title,
        content: data.content,
        description: data.description || undefined,
        type: (data.type || "BACKGROUND").toUpperCase(),
      });

      toast.success("提示词保存成功");
      setCanChange(false);
      // 可选：刷新数据
      router.push(`/me`);
    } catch (error) {
      // 错误已在拦截器中统一处理并显示 toast
    }
  };

  return (
    <>
      {/* Main Content */}
      <main className="container  mx-auto px-4 py-4 max-w-3xl mt-8 flex items-center justify-center">
        <div className="relative w-full">
          <LoadingOverlay
            show={isSubmitting || isLoading}
            text={isLoading ? "正在加载提示词..." : "正在保存提示词..."}
          />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>提示词</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 标题 */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="title"
                      className={cn(
                        "text-md font-bold",
                        !canChange && "text-muted-foreground"
                      )}
                    >
                      标题
                    </Label>
                    <Input
                      id="title"
                      placeholder="请输入提示词标题"
                      {...register("title")}
                      disabled={!canChange}
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
                      className={cn(
                        "text-md font-bold",
                        !canChange && "text-muted-foreground"
                      )}
                    >
                      描述（可选）
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="请输入提示词描述"
                      rows={2}
                      {...register("description")}
                      disabled={!canChange}
                    />
                  </div>

                  {/* 内容 */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="content"
                      className={cn(
                        "text-md font-bold",
                        !canChange && "text-muted-foreground"
                      )}
                    >
                      内容
                    </Label>
                    <Textarea
                      id="content"
                      placeholder="请输入提示词内容"
                      rows={4}
                      {...register("content")}
                      disabled={!canChange}
                    />
                    {errors.content && (
                      <p className="text-sm text-destructive">
                        {errors.content.message}
                      </p>
                    )}
                  </div>

                  {/* 提示词类型 */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="type"
                      className={cn(
                        "text-md font-bold",
                        !canChange && "text-muted-foreground"
                      )}
                    >
                      提示词类型
                    </Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!canChange}
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
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                      取消
                    </Button>
                    {!canChange && (
                      <Button
                        variant="outline"
                        className="bg-primary/10 text-primary"
                        onClick={() => setCanChange(true)}
                      >
                        编辑
                      </Button>
                    )}
                    {canChange && <Button type="submit">保存</Button>}
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

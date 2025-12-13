"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Copy,
  Lock,
  Unlock,
  Trash,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatTime } from "@/lib/time";
import { axiosClient, HttpError } from "@/lib/axios";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  title: string;
  description: string;
  content?: string;
  author: {
    name: string;
    avatar: string | null;
  };
  tags: string[];
  likeCount: number;
  commentCount: number;
  forkCount: number;
  createdAt: string;
  // 如果有图片/视频，可以添加这些字段
  images?: string[];
  videos?: string[];
  isLiked?: boolean;
  status: string;
}

interface PostCardProps {
  post: Post;
  onRefresh?: () => void;
}

export function MyPostCard({ post, onRefresh }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [postStatus, setPostStatus] = useState(post.status);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dropDownOpen, setDropDownOpen] = useState(false);
  const router = useRouter();
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const previousLiked = isLiked;
    const previousCount = likeCount;
    const nextLiked = !isLiked;
    const delta = nextLiked ? 1 : -1;

    setIsLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + delta));

    try {
      const result = await axiosClient.post(`/api/posts/${post.id}/like`, {
        action: nextLiked ? "increment" : "decrement",
      });
      const payload = result?.data ?? result;
      const data = payload?.data ?? payload;

      if (data) {
        setIsLiked(data.isLiked ?? nextLiked);
        if (typeof data.likeCount === "number") {
          setLikeCount(Math.max(data.likeCount, 0));
        }
      }
    } catch (error) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      const message = error instanceof HttpError ? error.message : "操作失败";
      console.error(message);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: 打开评论框或跳转到评论区
    router.push(`/posts/${post.id}`);
  };

  const handleFork = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/prompts/new?sourcePostId=${post.id}`);
  };

  const handleToggleStatus = async () => {
    if (updating) return;
    try {
      setUpdating(true);
      const newStatus = postStatus === "active" ? "hidden" : "active";
      await axiosClient.patch(`/api/posts/${post.id}`, { status: newStatus });
      setPostStatus(newStatus);
      setShowStatusDialog(false);
      onRefresh?.(); // 调用父组件的数据获取函数
      router.refresh();
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "操作失败";
      console.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    try {
      setDeleting(true);
      await axiosClient.delete(`/api/posts/${post.id}`);
      setShowDeleteDialog(false);
      onRefresh?.(); // 调用父组件的数据获取函数
      router.refresh();
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "删除失败";
      console.error(message);
    } finally {
      setDeleting(false);
    }
  };

  // 判断是否显示提示词内容
  const shouldShowContent =
    !post.images?.length && !post.videos?.length && post.content;

  return (
    <>
      <Link href={`/posts/${post.id}`} className="block">
        <div className="bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
          {/* 第一区域：用户信息 */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <div className="flex items-center space-x-2">
              {/* 用户头像 */}
              <div className="w-6 h-6 rounded-full bg-muted overflow-hidden">
                {post.author.avatar ? (
                  <Image
                    src={post.author.avatar}
                    alt={post.author.name}
                    width={28}
                    height={28}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <span className="text-muted-foreground text-xs">
                      {post.author.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* 用户名和时间 */}
              <div>
                <span className="font-medium text-muted-foreground text-sm break-words">
                  {post.author.name}
                </span>
              </div>
              <span
                className="text-muted-foreground text-lg font-semibold select-none"
                aria-hidden="true"
              >
                ·
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {formatTime(post.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* 帖子状态 */}
              <div className="text-sm text-muted-foreground">
                {postStatus === "active" ? (
                  <Badge
                    variant="outline"
                    className="rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-200 border-sky-100 dark:border-sky-900/50"
                  >
                    公开
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="rounded-full bg-destructive text-destructive-foreground"
                  >
                    私密
                  </Badge>
                )}
              </div>

              {/* 右侧三个点菜单 */}
              <DropdownMenu open={dropDownOpen} onOpenChange={setDropDownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowStatusDialog(true);
                    }}
                  >
                    {postStatus === "active" ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        设为私密
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        设为公开
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 第二区域：帖子内容 */}
          <div className="px-3 pb-2">
            {/* 标题 */}
            <div className="text-lg leading-6 font-semibold text-foreground mb-2 break-words">
              {post.title}
            </div>

            {/* 描述 */}
            {post.description && (
              <p className="text-muted-foreground mb-2 leading-5 text-sm break-words">
                {post.description}
              </p>
            )}

            {/* 图片/视频展示 */}
            {post.images?.length || post.videos?.length ? (
              <div className="mb-3">
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.slice(0, 4).map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                      >
                        <Image
                          src={image}
                          alt={`图片 ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {post.videos && post.videos.length > 0 && (
                  <div className="space-y-2">
                    {post.videos.map((video, index) => (
                      <video
                        key={index}
                        controls
                        className="w-full rounded-lg"
                        preload="none"
                      >
                        <source src={video} type="video/mp4" />
                      </video>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* 显示部分提示词内容 */
              shouldShowContent && (
                <div className="border border-border rounded-lg p-2 mb-2">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-light line-clamp-20 break-words">
                    {post.content}
                  </pre>
                </div>
              )
            )}
          </div>

          {/* 第三区域：操作按钮 */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="flex items-center space-x-6">
              {/* 点赞按钮 */}
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 transition-colors ${
                  isLiked
                    ? "text-destructive"
                    : "text-muted-foreground hover:text-destructive"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="text-sm font-medium">{likeCount}</span>
              </button>

              {/* 评论按钮 */}
              <button
                onClick={handleComment}
                className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{post.commentCount}</span>
              </button>

              {/* Fork按钮 */}
              <button
                onClick={handleFork}
                className="flex items-center space-x-1 text-muted-foreground hover:text-accent-foreground transition-colors"
              >
                <Copy className="w-5 h-5" />
                <span className="text-sm font-medium">{post.forkCount}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* 切换状态确认弹窗 */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {postStatus === "active" ? "设为私密" : "设为公开"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {postStatus === "active"
                ? "确定要将此帖子设为私密吗？设为私密后，只有你可以看到此帖子。"
                : "确定要将此帖子设为公开吗？设为公开后，所有人都可以看到此帖子。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleToggleStatus();
                setDropDownOpen(false);
              }}
              disabled={updating}
            >
              {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除帖子</AlertDialogTitle>
            <AlertDialogDescription>
              删除后不可恢复，确定要删除这个帖子吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
                setDropDownOpen(false);
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

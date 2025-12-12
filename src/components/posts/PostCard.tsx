"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Copy,
  Share2,
  Bookmark,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
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
        setLikeCount((prev) =>
          typeof data.likeCount === "number"
            ? Math.max(data.likeCount, 0)
            : Math.max(prev, 0)
        );
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

  // 判断是否显示提示词内容
  const shouldShowContent =
    !post.images?.length && !post.videos?.length && post.content;

  return (
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

          {/* 右侧三个点菜单 */}
          <DropdownMenu>
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
                  // TODO: 收藏功能
                }}
              >
                <Bookmark className="w-4 h-4 mr-2" />
                收藏
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(
                    window.location.origin + "/posts/" + post.id
                  );
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                分享链接
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // TODO: 举报功能
                }}
              >
                <Flag className="w-4 h-4 mr-2" />
                举报
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
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
  );
}

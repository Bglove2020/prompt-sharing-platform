"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Copy,
  Share2,
  Bookmark,
  Flag,
  ArrowLeft,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
  Skeleton,
} from "@/components/ui";
import { AutoResizeTextarea } from "@/components/auto-resize-textarea";
import { formatTime } from "@/lib/time";
import { axiosClient, HttpError } from "@/lib/axios";
import { toast } from "sonner";

interface Post {
  id: string;
  title: string;
  description: string;
  content?: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  tags: string[];
  likeCount: number;
  commentCount: number;
  forkCount: number;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  videos?: string[];
  isLiked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  likeCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[]; // 支持嵌套回复
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  const [replyLoading, setReplyLoading] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(
    null
  );
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const result = await axiosClient.get(`/api/posts/${postId}`);
      const payload = result?.data ?? result;
      const postData = payload?.data ?? payload;
      if (!postData) {
        throw new Error("帖子数据为空");
      }
      const normalizedTags = Array.isArray(postData.tags)
        ? postData.tags
        : typeof postData.tags === "string"
        ? postData.tags.split(",").filter(Boolean)
        : [];
      setPost({ ...postData, tags: normalizedTags });
      setLikeCount(postData.likeCount ?? 0);
      setIsLiked(Boolean(postData.isLiked));
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "获取帖子失败";
      toast.error(message);
      router.push("/posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentLoading(true);
      const result = await axiosClient.get(`/api/posts/${postId}/comments`);
      setComments(result.data);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "获取评论失败";
      toast.error(message);
    } finally {
      setCommentLoading(false);
    }
  };

  const fetchReplies = async (
    commentId: string,
    parentPath: string = "",
    options: { refresh?: boolean } = {}
  ) => {
    const fullPath = parentPath ? `${parentPath}.${commentId}` : commentId;
    const shouldRefresh = options.refresh;

    // 如果已经展开且不是刷新，执行收起
    if (expandedReplies.has(fullPath) && !shouldRefresh) {
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        next.delete(fullPath);
        return next;
      });
      return;
    }

    // 如果不是刷新且正在加载或已有数据，直接展开即可
    if (!shouldRefresh && (replyLoading.has(fullPath) || replies[fullPath])) {
      setExpandedReplies((prev) => new Set(prev).add(fullPath));
      return;
    }

    try {
      setReplyLoading((prev) => new Set(prev).add(fullPath));
      const result = await axiosClient.get(
        `/api/posts/${postId}/comments/${commentId}/replies`
      );
      setReplies((prev) => ({
        ...prev,
        [fullPath]: result.data,
      }));
      setExpandedReplies((prev) => new Set(prev).add(fullPath));
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "获取回复失败";
      toast.error(message);
    } finally {
      setReplyLoading((prev) => {
        const next = new Set(prev);
        next.delete(fullPath);
        return next;
      });
    }
  };

  // 递归渲染评论组件
  const renderComment = (
    comment: Comment,
    depth: number = 0,
    parentPath: string = ""
  ) => {
    const currentPath = parentPath ? `${parentPath}.${comment.id}` : comment.id;
    const isExpanded = expandedReplies.has(currentPath);
    const commentReplies = replies[currentPath] || comment.replies || [];
    const hasReplies = comment.replyCount > 0 || commentReplies.length > 0;
    const indentLevel = Math.min(depth, 5); // 限制最大缩进层级，避免过度缩进

    return (
      <div
        key={comment.id}
        className="space-y-3 border-l-2 border-gray-100 pl-2"
      >
        <div className="flex gap-0 flex-col">
          <div className="flex gap-3">
            <Avatar className="w-7 h-7 flex-shrink-0">
              {comment.author.avatar ? (
                <AvatarImage
                  src={comment.author.avatar}
                  alt={comment.author.name}
                />
              ) : null}
              <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900 break-words">
                  {comment.author.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => {
                    setReplyingTo(
                      replyingTo === comment.id ? null : comment.id
                    );
                    if (replyingTo !== comment.id) {
                      setReplyContent("");
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-blue-500 transition-colors"
                >
                  回复
                </button>
                {hasReplies && (
                  <button
                    onClick={() => fetchReplies(comment.id, parentPath)}
                    className="text-xs text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-1"
                    disabled={replyLoading.has(currentPath)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="w-4 h-4 rotate-180" />
                        收起 {comment.replyCount || commentReplies.length}{" "}
                        条回复
                      </>
                    ) : (
                      <>
                        {replyLoading.has(currentPath) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        展开 {comment.replyCount || commentReplies.length}{" "}
                        条回复
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* 回复输入框 */}
          {replyingTo === comment.id && (
            <div className="mt-3 w-full">
              <AutoResizeTextarea
                placeholder="写下你的回复..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={1}
                actionButtons={[
                  {
                    label: "取消",
                    variant: "secondary",
                    size: "sm",
                    onClick: () => {
                      setReplyingTo(null);
                      setReplyContent("");
                    },
                  },
                  {
                    label:
                      submittingReplyId === comment.id ? "发布中..." : "发布",
                    onClick: (e) => {
                      e.preventDefault();
                      handleSubmitComment(comment.id);
                    },
                    disabled:
                      submittingReplyId === comment.id || !replyContent.trim(),
                    loading: submittingReplyId === comment.id,
                    size: "sm",
                  },
                ]}
              />
            </div>
          )}
        </div>

        {/* 递归渲染回复 */}
        {isExpanded && commentReplies.length > 0 && (
          <div
            className="space-y-3 "
            style={{ marginLeft: `${(indentLevel + 1) * 1.5}rem` }}
          >
            {commentReplies.map((reply) =>
              renderComment(reply, depth + 1, currentPath)
            )}
          </div>
        )}
      </div>
    );
  };

  const handleSubmitComment = async (parentCommentId?: string) => {
    const content = parentCommentId ? replyContent : newComment;
    if (!content.trim()) {
      toast.error("评论内容不能为空");
      return;
    }

    try {
      if (parentCommentId) {
        setSubmittingReplyId(parentCommentId);
      } else {
        setSubmittingComment(true);
      }

      const result = await axiosClient.post(`/api/posts/${postId}/comments`, {
        content,
        parentCommentId: parentCommentId || undefined,
      });

      if (parentCommentId) {
        // 找到父评论所在的路径键，决定刷新哪一级的回复列表
        let parentRepliesPath = "";
        for (const [path, replyList] of Object.entries(replies)) {
          if (replyList.some((r: Comment) => r.id === parentCommentId)) {
            parentRepliesPath = path;
            break;
          }
        }

        // 若未找到，说明父评论是顶层评论
        const parentPathForFetch = parentRepliesPath;

        await fetchReplies(parentCommentId, parentPathForFetch, {
          refresh: true,
        });
        setReplyContent("");
        setReplyingTo(null);
      } else {
        // 如果是新评论，添加到列表顶部
        setComments((prev) => [result.data, ...prev]);
        setNewComment("");
      }

      toast.success(parentCommentId ? "回复发布成功" : "评论发布成功");

      // 更新帖子评论数
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "发布失败";
      toast.error(message);
    } finally {
      if (parentCommentId) {
        setSubmittingReplyId(null);
      } else {
        setSubmittingComment(false);
      }
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const previousLiked = isLiked;
    const previousCount = likeCount;
    const nextLiked = !isLiked;
    const delta = nextLiked ? 1 : -1;

    // 乐观更新
    setIsLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + delta));

    try {
      const result = await axiosClient.post(`/api/posts/${postId}/like`, {
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
      toast.error(message);
    }
  };

  const shouldShowContent =
    !post?.images?.length && !post?.videos?.length && post?.content;

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      {/* 帖子内容卡片 */}
      <Card className="mb-6">
        <CardContent className="p-0">
          {/* 第一区域：用户信息 */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                {post.author.avatar ? (
                  <AvatarImage
                    src={post.author.avatar}
                    alt={post.author.name}
                  />
                ) : null}
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-gray-700 text-sm">
                {post.author.name}
              </span>
              <span
                className="text-gray-500 text-lg font-semibold select-none"
                aria-hidden="true"
              >
                ·
              </span>
              <span className="text-sm text-gray-500">
                {formatTime(post.createdAt)}
              </span>
            </div>

            {/* 右侧三个点菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Bookmark className="w-4 h-4 mr-2" />
                  收藏
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(
                      window.location.origin + "/posts/" + post.id
                    );
                    toast.success("链接已复制");
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  分享链接
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Flag className="w-4 h-4 mr-2" />
                  举报
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 第二区域：帖子内容 */}
          <div className="px-6 pb-4">
            {/* 标题 */}
            <div className="text-2xl leading-7 font-semibold text-gray-900 mb-3 break-words">
              {post.title}
            </div>

            {/* 描述 */}
            {post.description && (
              <p className="text-gray-600 mb-3 leading-6 text-base break-words">
                {post.description}
              </p>
            )}

            {/* 图片/视频展示 */}
            {post.images?.length || post.videos?.length ? (
              <div className="mb-4">
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
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
              /* 显示完整提示词内容 */
              shouldShowContent && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-light break-words">
                    {post.content}
                  </pre>
                </div>
              )
            )}

            {/* 标签 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* 第三区域：操作按钮 */}
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center space-x-6">
              {/* 点赞按钮 */}
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 transition-colors ${
                  isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="text-sm font-medium">{likeCount}</span>
              </button>

              {/* 评论按钮 */}
              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{post.commentCount}</span>
              </button>

              {/* Fork按钮 */}
              <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
                <Copy className="w-5 h-5" />
                <span className="text-sm font-medium">{post.forkCount}</span>
              </button>
            </div>
          </div>

          <Separator />

          {/* 评论区域 */}
          <div className="px-6 pb-6 pt-4 space-y-6">
            <AutoResizeTextarea
              placeholder="写下你的评论..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={1}
              actionButtons={[
                {
                  label: "清空",
                  variant: "secondary",
                  size: "sm",
                  onClick: () => setNewComment(""),
                  disabled: submittingComment,
                },
                {
                  label: submittingComment ? "发布中..." : "评论",
                  size: "sm",
                  onClick: (e) => {
                    e.preventDefault();
                    handleSubmitComment();
                  },
                  disabled: submittingComment || !newComment.trim(),
                  loading: submittingComment,
                },
              ]}
            />

            {/* <Separator /> */}

            {/* 评论列表 */}
            {commentLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无评论，快来发表第一条评论吧！
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => renderComment(comment, 0))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

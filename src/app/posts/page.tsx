"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { Plus, Loader2 } from "lucide-react";
import { axiosClient, HttpError } from "@/lib/axios";
import { SingleSelect } from "@/components/prompts/single-select";
import { PostCard } from "@/components/posts/PostCard";

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
  images?: string[];
  videos?: string[];
  isLiked?: boolean;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [sortBy, setSortBy] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");

  const sortOptions = [
    { value: "latest", label: "最新发布" },
    { value: "popular", label: "最受欢迎" },
    { value: "most-forked", label: "最多Fork" },
  ];

  useEffect(() => {
    fetchPosts();
  }, [selectedTag, sortBy, searchQuery]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sort: sortBy,
      });

      if (selectedTag !== "全部") {
        params.append("tag", selectedTag);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const result = await axiosClient.get(`/api/posts?${params}`);
      const payload = result?.data ?? result;
      const list = payload?.data ?? payload;
      setPosts(Array.isArray(list) ? list : []);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "网络错误，请稍后重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:px-12 lg:px-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">提示词广场</h1>
            <p className="text-muted-foreground mt-2">
              发现和分享优质的AI提示词，提升您的工作效率
            </p>
          </div>
        </div>

        <div className="pt-2 mb-4 sm:mb-8 flex w-full max-w-3xl flex-nowrap items-end gap-4 overflow-x-auto border-b border-border pb-4">
          <SingleSelect
            label="排序"
            placeholder="选择排序"
            value={sortBy}
            options={sortOptions}
            onChange={setSortBy}
            className="min-w-[120px]"
          />
          <div className="flex flex-col gap-2 min-w-[120px] ">
            <Input
              id="tag-input"
              placeholder="筛选标签..."
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="h-10 text-sm text-muted-foreground"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchPosts} className="mt-4">
              重试
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {/* Posts List */}
        {!loading && !error && (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无帖子</p>
            <Link href="/posts/new">
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                创建第一个帖子
              </Button>
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

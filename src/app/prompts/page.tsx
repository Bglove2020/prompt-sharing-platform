"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Plus, Loader2 } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import { axiosClient, HttpError } from "@/lib/axios";

interface Prompt {
  id: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string | null;
  };
  tags: string[];
  _count: {
    likes: number;
    comments: number;
    forks: number;
  };
  createdAt: string;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTag, setSelectedTag] = useState("全部");
  const [sortBy, setSortBy] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");

  const tags = ["全部", "编程", "写作", "设计", "营销", "学习", "生活"];

  useEffect(() => {
    fetchPrompts();
  }, [selectedTag, sortBy, searchQuery]);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sort:
          sortBy === "最受欢迎"
            ? "popular"
            : sortBy === "最多Fork"
            ? "most-forked"
            : "latest",
      });

      if (selectedTag !== "全部") {
        params.append("tag", selectedTag);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const result = await axiosClient.get(`/api/prompts?${params}`);
      setPrompts(result.data);
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
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">提示词广场</h1>
            <p className="text-muted-foreground mt-2">
              发现和分享优质的AI提示词，提升您的工作效率
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <select
              className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="latest">最新发布</option>
              <option value="popular">最受欢迎</option>
              <option value="most-forked">最多Fork</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Button
                key={tag}
                variant={tag === selectedTag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchPrompts} className="mt-4">
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

        {/* Prompts Grid */}
        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <Card
                key={prompt.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <Link href={`/prompts/${prompt.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {prompt.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {prompt.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {prompt.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <span>{prompt.author.name}</span>
                        <span>•</span>
                        <span>
                          {new Date(prompt.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <span>👍</span>
                          <span>{prompt._count.likes}</span>
                        </span>
                        <span className="flex items-center">
                          <span>💬</span>
                          <span>{prompt._count.comments}</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && prompts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无提示词</p>
            <Link href="/prompts/new">
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                创建第一个提示词
              </Button>
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

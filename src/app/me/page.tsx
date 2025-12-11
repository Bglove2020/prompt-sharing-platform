"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { axiosClient, HttpError } from "@/lib/axios";
import { NavbarAuthenticated } from "@/components/layout/navbar-authenticated";
import { useSession } from "next-auth/react";
import { Pagination } from "@/types";
import PromptCard from "@/components/propmtCard";
import { PostCard } from "@/components/posts/PostCard";

interface Prompt {
  id: string;
  title: string;
  description: string;
  type: "BACKGROUND" | "TEMPLATE";
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
  status: "DRAFT" | "PUBLISHED";
  tags: string[];
  _count: {
    likes: number;
    comments: number;
    forks: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  content?: string;
}

export default function MyPage() {
  const [data, setData] = useState<Prompt[] | Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("prompts");
  const [error, setError] = useState("");
  const { data: session } = useSession();
  console.log("session", session);

  useEffect(() => {
    getMyData();
  }, [activeTab]);

  const getMyData = async () => {
    try {
      setLoading(true);
      const result = await axiosClient.get(
        `/api/user/${activeTab === "prompts" ? "prompts" : "posts"}`
      );
      setData(result.data);
      // setPagination(result.pagination as Pagination);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "网络错误，请稍后重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个提示词吗？")) {
      return;
    }

    try {
      await axiosClient.delete(`/api/user/prompts/${id}`);
      setData(data.filter((p) => p.id !== id));
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "删除失败，请稍后重试";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavbarAuthenticated />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <div className="flex items-center px-2 gap-3 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={session!.user.avatar!} alt="me" />
            <AvatarFallback>{session!.user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {session!.user.name}
            </h1>
            <p className="text-muted-foreground mt-1">{session!.user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border">
          <Button
            variant="ghost"
            size="lg"
            className={`rounded-full text-lg text-muted-foreground px-4 py-6 font-semibold hover:bg-secondary ${
              activeTab === "prompts"
                ? "bg-secondary text-secondary-foreground"
                : ""
            }`}
            onClick={() => {
              setActiveTab("prompts");
              // getMyData();
            }}
          >
            提示词
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className={`rounded-full text-lg text-muted-foreground px-4 py-6 font-semibold hover:bg-secondary ${
              activeTab === "posts"
                ? "bg-secondary text-secondary-foreground"
                : ""
            }`}
            onClick={() => {
              setActiveTab("posts");
              // getMyData();
            }}
          >
            帖子
          </Button>
          <div className="flex flex-1 justify-end">
            {activeTab === "prompts" && (
              <Link href="/prompts/new">
                <div className=" flex flex-0 items-center gap-2 rounded-full bg-secondary p-2 px-4">
                  <Plus className="w-5 h-5 font-bold" />
                  <span className="text-base font-semibold text-muted-foreground">
                    创建提示词
                  </span>
                </div>
              </Link>
            )}
            {activeTab === "posts" && (
              <Link href="/posts/new">
                <div className=" flex flex-0 items-center gap-2 rounded-full bg-secondary p-2 px-4">
                  <Plus className="w-5 h-5 font-bold" />
                  <span className="text-base font-semibold text-muted-foreground">
                    创建帖子
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="flex mb-4"></div>
        {/* Prompts List */}
        {!loading && !error && (
          <div className="space-y-4">
            {activeTab === "prompts"
              ? data.map((item) => (
                  <PromptCard key={item.id} prompt={item as Prompt} />
                ))
              : data.map((item) => (
                  <PostCard key={item.id} post={item as Post} />
                ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {activeTab === "prompts"
                ? "您还没有创建任何提示词"
                : "您还没有创建任何帖子"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Plus } from "lucide-react";
import { axiosClient, HttpError } from "@/lib/axios";
import { NavbarAuthenticated } from "@/components/layout/navbar-authenticated";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/types";
import PromptCard from "@/components/propmtCard";
import { MyPostCard } from "@/components/posts/myPostCard";

import { Prompt as PromptModel } from "@/generated/prisma/client";

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
  isLiked?: boolean;
  status: string;
}

function MyPageContent() {
  const searchParams = useSearchParams();
  const initialTabParam =
    searchParams.get("tab") || searchParams.get("view") || "prompts";
  const initialTab = initialTabParam === "posts" ? "posts" : "prompts";
  const [prompts, setPrompts] = useState<PromptModel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"prompts" | "posts">(initialTab);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  console.log("session", session);

  const getMyData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await axiosClient.get(
        `/api/user/${activeTab === "prompts" ? "prompts" : "posts"}`
      );
      const payload = result?.data ?? result;
      const list = payload?.data ?? payload;
      if (activeTab === "prompts") {
        setPrompts(Array.isArray(list) ? (list as PromptModel[]) : []);
      } else {
        const normalized = Array.isArray(list)
          ? (list as any[]).map((item) => ({
              ...item,
              tags: Array.isArray(item.tags)
                ? item.tags
                : typeof item.tags === "string"
                ? item.tags.split(",").filter(Boolean)
                : [],
              likeCount: item.likeCount ?? 0,
              commentCount: item.commentCount ?? 0,
              forkCount: item.forkCount ?? 0,
            }))
          : [];
        setPosts(normalized as Post[]);
      }
      // setPagination(result.pagination as Pagination);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "网络错误，请稍后重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    getMyData();
  }, [getMyData]);

  const handleDelete = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <NavbarAuthenticated />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        {status === "loading" && (
          <p className="text-center text-muted-foreground py-8">加载中...</p>
        )}
        {status === "unauthenticated" && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">请先登录后查看</p>
            <Link href="/auth/signin" className="text-primary underline">
              去登录
            </Link>
          </div>
        )}
        {status === "authenticated" && (
          <>
            <div className="flex items-center px-2 gap-3 mb-4">
              <Avatar className="w-16 h-16">
                {session?.user?.avatar ? (
                  <AvatarImage src={session.user.avatar} alt="me" />
                ) : null}
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {session?.user?.name || "用户"}
                </h1>
                {session?.user?.email && (
                  <p className="text-muted-foreground mt-1">
                    {session.user.email}
                  </p>
                )}
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
                  ? prompts.map((item) => (
                      <PromptCard
                        key={item.id}
                        prompt={item}
                        onDeleted={handleDelete}
                      />
                    ))
                  : posts.map((item) => (
                      <MyPostCard
                        key={item.id}
                        post={item}
                        onRefresh={getMyData}
                      />
                    ))}
              </div>
            )}

            {/* Empty State */}
            {!loading &&
              !error &&
              (activeTab === "prompts"
                ? prompts.length === 0
                : posts.length === 0) && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "prompts"
                      ? "您还没有创建任何提示词"
                      : "您还没有创建任何帖子"}
                  </p>
                </div>
              )}
          </>
        )}
      </main>
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <NavbarAuthenticated />
          <main className="container mx-auto px-4 py-4">
            <p className="text-center text-muted-foreground py-8">加载中...</p>
          </main>
        </div>
      }
    >
      <MyPageContent />
    </Suspense>
  );
}

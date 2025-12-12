import Link from "next/link";
import { Button } from "@/components/ui";
import { ArrowRight, Sparkles, Users, Zap } from "lucide-react";
import { NavbarGuest } from "@/components/layout/navbar-guest";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <NavbarGuest />

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-10 sm:py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-[1.3]">
            发现、分享、创造和管理优质AI提示词
            <br />
            <span className="text-primary block mt-4"></span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            在任何地方快速插入您的提示词，在社区中发现更多优质提示词，提升您的工作效率
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                立即开始 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/posts">
              <Button variant="outline" size="lg">
                浏览提示词
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-10 sm:mt-20">
          <div className="text-center p-6 rounded-lg bg-card border border-border text-card-foreground">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">浏览器扩展</h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              支持ChatGPT、Claude、Gemini、DeepSeek等主流AI网站，一键快速插入您构建的提示词
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border border-border text-card-foreground">
            <div className="w-12 h-12 bg-accent/10 text-accent-foreground rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">社区分享</h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              发现优质提示词，点赞、讨论、Fork、创建自己的提示词，与社区一起成长
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border border-border text-card-foreground">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 dark:bg-purple-100 dark:text-purple-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">智能管理</h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              根据不同场景，创建不同的提示词，支持变量自定义，版本历史追踪
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-10 sm:mt-20 p-12 bg-muted rounded-2xl shadow-md">
          <h2 className="text-3xl font-bold mb-4">
            准备好提升您的AI体验了吗？
          </h2>
          <p className="text-muted-foreground mb-6">
            加入社区，发现提示词的无限可能
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              立即注册 <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-5 sm:mt-10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © 2024 PromptHub. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                关于我们
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                隐私政策
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                服务条款
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

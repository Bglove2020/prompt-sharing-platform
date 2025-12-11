"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";

export function NavbarGuest() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`flex items-center justify-between px-4 py-3 sticky top-0 z-50 backdrop-blur-md bg-background/50 transition-all duration-200 border-b border-border/40 ${
        isScrolled ? " shadow-sm" : ""
      }`}
    >
      <Link href="/" className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-primary" />
        <span className="text-2xl font-bold hidden sm:inline">PromptHub</span>
      </Link>
      <div className="flex items-center gap-4">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="切换主题"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        )}
        <Link href="/login">
          <Button variant="outline">登录</Button>
        </Link>
        <Link href="/register">
          <Button>注册</Button>
        </Link>
      </div>
    </nav>
  );
}

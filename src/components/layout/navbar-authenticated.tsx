"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Moon,
  Sun,
  Sparkles,
  Search,
  Plus,
  User,
  LogOut,
  Settings,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui";
import { toast } from "sonner";
import { axiosClient } from "@/lib/axios";

export function NavbarAuthenticated() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session, update } = useSession();
  const router = useRouter();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  console.log("navbar authenticated session", session);
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

  const userInitials = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email
    ? session.user.email.charAt(0).toUpperCase()
    : "U";

  const currentAvatar = useMemo(
    () => previewUrl || session?.user?.avatar || "",
    [previewUrl, session?.user?.avatar]
  );

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("仅支持 jpeg/png/webp");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("图片不能超过 2MB");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("请先选择图片");
      return;
    }
    setUploading(true);
    try {
      type PresignResp = {
        uploadUrl: string;
        avatarUrl: string;
        headers?: Record<string, string>;
      };

      const presign = (await axiosClient.post<PresignResp>(
        "/api/upload/avatar/presign",
        {
          filename: selectedFile.name,
          mimeType: selectedFile.type,
          size: selectedFile.size,
        }
      )) as unknown as PresignResp;

      const uploadHeaders: Record<string, string> =
        presign.headers && typeof presign.headers === "object"
          ? (presign.headers as Record<string, string>)
          : { "Content-Type": selectedFile.type };

      await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: uploadHeaders,
        body: selectedFile,
      });

      await axiosClient.patch("/api/user/avatar", {
        avatarUrl: presign.avatarUrl,
      });

      // 更新 session 中的 avatar（注意结构需带 user）
      await update?.({ user: { avatar: presign.avatarUrl } });
      toast.success("头像更新成功");
      setAvatarOpen(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      router.refresh();
    } catch (error: any) {
      // 错误已在拦截器中统一处理并显示 toast
    } finally {
      setUploading(false);
    }
  };

  return (
    <nav
      className={`flex items-center justify-between px-4 py-3 sticky top-0 z-50 backdrop-blur-md bg-background/50 transition-all duration-200 border-b border-border/40 ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <Link href="/posts" className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-primary" />
        <span className="text-2xl font-bold hidden sm:inline">PromptHub</span>
      </Link>
      <div className="flex items-center gap-2">
        {/* <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/prompts")}
          aria-label="搜索"
        >
          <Search className="w-5 h-5" />
        </Button> */}
        {/* {mounted && ( */}
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
        {/* )} */}
        <Link href="/posts/new">
          <Button variant="ghost" size="icon" aria-label="创建帖子">
            <Plus className="w-5 h-5" />
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                {session?.user?.avatar ? (
                  <AvatarImage
                    src={session.user.avatar}
                    alt={session.user.name || "用户"}
                  />
                ) : null}
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name || "用户"}
                </p>
                {session?.user?.email && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/me" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                我的
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setAvatarOpen(true);
              }}
            >
              <User className="mr-2 h-4 w-4" />
              更换头像
            </DropdownMenuItem>
            {/* <DropdownMenuItem asChild>
              <Link href="/me/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                设置
              </Link>
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                signOut({ callbackUrl: "/" });
              }}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog
        open={avatarOpen}
        onOpenChange={(open) => {
          if (!open && previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setSelectedFile(null);
          }
          setAvatarOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更换头像</DialogTitle>
            <DialogDescription>
              仅支持 jpeg/png/webp，最大 2MB。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {currentAvatar ? (
                <AvatarImage src={currentAvatar} alt="新头像预览" />
              ) : (
                <AvatarFallback>{userInitials}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar-upload">选择图片</Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }
                setSelectedFile(null);
                setAvatarOpen(false);
              }}
            >
              取消
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "上传中..." : "上传并保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}

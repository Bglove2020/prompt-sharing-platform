import { useState } from "react";
import { Prompt } from "@/generated/prisma/client";
import { Edit, Loader2, Share2, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { axiosClient, HttpError } from "@/lib/axios";

type PromptCardProps = {
  prompt: Prompt;
  onDeleted?: (id: string) => void;
};

type ConfirmDeleteDialogProps = {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDeleteDialog({
  open,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[320px] p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">删除提示词</h3>
        <p className="text-sm text-gray-600 mb-5">
          删除后不可恢复，确定要删除这个提示词吗？
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-destructive text-white text-sm hover:bg-destructive/90 disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PromptCard({ prompt, onDeleted }: PromptCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleShareAsPost = () => {
    // 将数据暂存到 sessionStorage，避免过长 URL
    try {
      const payload = {
        title: prompt.title ?? "",
        description: prompt.description ?? "",
        content: prompt.content ?? "",
        type: prompt.type ?? "background",
      };
      sessionStorage.setItem(
        "prefill-post-from-prompt",
        JSON.stringify(payload)
      );
    } catch (err) {
      console.error("缓存提示词预填数据失败", err);
    }
    router.push("/posts/new");
  };

  const handleDelete = async () => {
    if (deleting) return;
    try {
      setDeleting(true);
      await axiosClient.delete(`/api/prompts/${prompt.id}`);
      onDeleted ? onDeleted(prompt.id) : router.refresh();
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "删除失败，请稍后重试";
      console.error(message);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
      {/* 第二区域：帖子内容 */}
      <div className="p-4 py-3">
        {/* 标题 */}
        <div className="text-lg leading-6 font-semibold text-gray-900 mb-2 break-words">
          {prompt.title}
        </div>

        {/* 描述 */}
        {prompt.description && (
          <p className="text-gray-600 mb-2 leading-5 text-sm break-words">
            {prompt.description}
          </p>
        )}
        <div className="border border-gray-200 rounded-lg p-2 ">
          <pre className="text-sm text-gray-400 whitespace-pre-wrap font-light line-clamp-20 break-words">
            {prompt.content}
          </pre>
        </div>
      </div>

      {/* 第三区域：操作按钮 */}
      <div className="flex items-center justify-end px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          {/* 分享为帖子 */}
          <button
            className="flex items-center space-x-1 text-gray-500 hover:text-primary transition-colors"
            onClick={handleShareAsPost}
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* 查看/编辑按钮 */}
          <button
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
            onClick={() => router.push(`/prompts/${prompt.id}`)}
          >
            <Edit className="w-5 h-5 text-primary" />
          </button>

          {/* 删除按钮 */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={deleting}
            className="flex items-center space-x-1 text-gray-500 hover:text-destructive transition-colors disabled:cursor-not-allowed"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-destructive" />
            ) : (
              <Trash className="w-5 h-5 text-destructive" />
            )}
          </button>
        </div>
      </div>
      <ConfirmDeleteDialog
        open={showConfirm}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

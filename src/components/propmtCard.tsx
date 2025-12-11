import { Prompt } from "@/generated/prisma/client";
import { Edit, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  const router = useRouter();
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
      {/* 第二区域：帖子内容 */}
      <div className="p-4 py-3">
        {/* 标题 */}
        <div className="text-lg leading-6 font-semibold text-gray-900 mb-2">
          {prompt.title}
        </div>

        {/* 描述 */}
        {prompt.description && (
          <p className="text-gray-600 mb-2 leading-5 text-sm">
            {prompt.description}
          </p>
        )}
        <div className="border border-gray-200 rounded-lg p-2 ">
          <pre className="text-sm text-gray-400 whitespace-pre-wrap font-light line-clamp-20">
            {prompt.content}
          </pre>
        </div>
      </div>

      {/* 第三区域：操作按钮 */}
      <div className="flex items-center justify-end px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          {/* 评论按钮 */}
          <button
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
            onClick={() => router.push(`/prompts/${prompt.id}`)}
          >
            <Edit className="w-5 h-5 text-primary" />
            {/* <span className="text-sm font-medium">你好</span> */}
          </button>

          {/* Fork按钮 */}
          <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
            <Trash className="w-5 h-5 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}

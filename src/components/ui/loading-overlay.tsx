import { Loader2 } from "lucide-react";

type LoadingOverlayProps = {
  show: boolean;
  text?: string;
};

/**
 * 全局可复用的毛玻璃加载遮罩，用于提交时阻断点击。
 */
export function LoadingOverlay({ show, text }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/40 backdrop-blur-sm"
      aria-busy="true"
      role="status"
    >
      <div className="flex items-center gap-2 text-primary">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        {text ? (
          <span className="text-base font-medium text-muted-foreground">
            {text}
          </span>
        ) : (
          <span className="sr-only text-base font-medium text-muted-foreground">
            加载中
          </span>
        )}
      </div>
    </div>
  );
}

import { forwardRef, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

type ActionButton = {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
  size?: "sm" | "default";
  className?: string;
};

type AutoResizeTextareaProps = React.ComponentPropsWithoutRef<
  typeof Textarea
> & {
  actionButtons: [ActionButton, ActionButton];
  containerClassName?: string;
};

const AutoResizeTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(
  (
    {
      className,
      containerClassName,
      value,
      onChange,
      actionButtons,
      rows,
      ...props
    },
    ref
  ) => {
    const localRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (node: HTMLTextAreaElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
          node;
      }
    };

    const resize = () => {
      const el = localRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };

    useEffect(() => {
      resize();
    }, [value]);

    useEffect(() => {
      resize();
    }, []);

    const renderButton = (btn: ActionButton, idx: number) => {
      const isSecondary = btn.variant === "secondary";
      return (
        <Button
          key={idx}
          size={btn.size || "default"}
          variant={isSecondary ? "secondary" : "default"}
          className={cn(
            isSecondary
              ? "rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "rounded-full px-4",
            btn.className
          )}
          onClick={btn.onClick}
          disabled={btn.disabled || btn.loading}
        >
          {btn.loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          {btn.label}
        </Button>
      );
    };

    return (
      <div
        className={cn(
          "flex flex-col items-end gap-1 border border-gray-200 rounded-xl p-2",
          containerClassName
        )}
      >
        <Textarea
          ref={setRefs}
          value={value}
          rows={rows ?? 1}
          onChange={(e) => {
            resize();
            onChange?.(e);
          }}
          {...props}
          className={cn(
            "w-full min-h-[60px] p-1 shadow-none rounded-xl border-none focus-visible:ring-0 focus-visible:ring-offset-0 overflow-hidden resize-none",
            className
          )}
        />
        <div className="flex gap-2">
          {renderButton(actionButtons[0], 0)}
          {renderButton(actionButtons[1], 1)}
        </div>
      </div>
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { AutoResizeTextarea };

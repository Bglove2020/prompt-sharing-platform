import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
};

/**
 * 单选下拉封装，基于 shadcn Select。
 */
export function SingleSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* <span className="text-sm font-medium text-muted-foreground">{label}</span> */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 focus:ring-0">
          <SelectValue placeholder={placeholder ?? "请选择"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{label}</SelectLabel>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

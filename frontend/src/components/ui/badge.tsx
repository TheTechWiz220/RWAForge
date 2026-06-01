import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          default: "bg-primary text-primary-foreground",
          secondary: "bg-secondary text-secondary-foreground",
          outline: "border border-border text-foreground",
          success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
          warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          destructive: "bg-red-500/15 text-red-600 dark:text-red-400",
        }[variant],
        className
      )}
      {...props}
    />
  );
}

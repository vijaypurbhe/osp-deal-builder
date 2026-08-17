import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "warning" | "critical";
}

const toneClass: Record<string, string> = {
  default: "text-foreground",
  positive: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
};

const toneChip: Record<string, string> = {
  default: "bg-primary/10 text-primary",
  positive: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

export default function KpiCard({ label, value, hint, icon: Icon, tone = "default" }: KpiCardProps) {
  return (
    <Card className="h-full overflow-hidden transition-shadow hover:shadow-raised">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p
            className="min-w-0 text-[11px] font-semibold uppercase leading-4 tracking-wide text-muted-foreground"
            title={label}
          >
            {label}
          </p>
          {Icon && (
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                toneChip[tone],
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <div className="mt-auto min-w-0">
          <p
            className={cn(
              "font-display text-xl font-semibold leading-tight tabular-nums whitespace-normal break-words sm:text-2xl",
              toneClass[tone],
            )}
            title={value}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 truncate text-xs text-muted-foreground" title={hint}>
              {hint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

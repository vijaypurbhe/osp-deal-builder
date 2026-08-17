import SectionCard from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { HealthScore } from "@/lib/economics";

const tone: Record<HealthScore["band"], "secondary" | "outline" | "destructive"> = {
  Strong: "secondary",
  Healthy: "secondary",
  "At risk": "outline",
  Critical: "destructive",
};

export default function DealHealthCard({ health }: { health: HealthScore }) {
  return (
    <SectionCard
      title="Deal health"
      description="Customer value, Salesforce value, TechM economics, commercial readiness and risk"
      actions={<Badge variant={tone[health.band]}>{health.score} / 100 · {health.band}</Badge>}
    >
      <div className="space-y-3">
        {health.drivers.map((d) => (
          <div key={d.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                {d.label} <span className="text-muted-foreground">({Math.round(d.weight * 100)}% weight)</span>
              </span>
              <span className="text-muted-foreground">{Math.round(d.score)}/100 · {d.detail}</span>
            </div>
            <Progress value={d.score} className="h-2" />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { percent } from "@/lib/format";

interface Props {
  label: string;
  value: number;
  disabled?: boolean;
  max?: number;
  onCommit: (value: number) => void;
}

/** Slider that tracks the drag locally so the thumb and read-out move immediately. */
export default function LeverSlider({ label, value, disabled, max = 80, onCommit }: Props) {
  const [local, setLocal] = useState(Number(value) || 0);
  useEffect(() => setLocal(Number(value) || 0), [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-medium tabular-nums">{percent(local)}</span>
      </div>
      <Slider
        disabled={disabled}
        value={[local]}
        min={0}
        max={max}
        step={0.5}
        onValueChange={(v) => setLocal(v[0])}
        onValueCommit={(v) => onCommit(v[0])}
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  value: number;
  disabled?: boolean;
  step?: number;
  hint?: string;
  onCommit: (value: number) => void;
}

/** Numeric field that keeps local keystrokes and commits on blur or Enter. */
export default function LeverInput({ label, value, disabled, step = 0.5, hint, onCommit }: Props) {
  const [local, setLocal] = useState(String(Number(value) || 0));
  useEffect(() => setLocal(String(Number(value) || 0)), [value]);

  const commit = () => {
    const next = Number(local) || 0;
    if (next !== Number(value)) onCommit(next);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step={step}
        disabled={disabled}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

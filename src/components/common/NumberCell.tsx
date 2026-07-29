import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface NumberCellProps {
  value: number;
  disabled?: boolean;
  step?: string;
  className?: string;
  onCommit: (value: number) => void;
}

/**
 * Controlled numeric cell that stays in sync with the underlying row value.
 * Uncontrolled inputs kept stale DOM values when rows were re-used across
 * scenario switches or after adding lines — this keeps local edits while
 * typing, commits on blur/Enter, and re-syncs whenever the source value changes.
 */
export function NumberCell({ value, disabled, step, className, onCommit }: NumberCellProps) {
  const [local, setLocal] = useState(String(value ?? 0));
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) setLocal(String(value ?? 0));
  }, [value]);

  const commit = () => {
    dirty.current = false;
    const next = local === "" ? 0 : Number(local);
    if (Number.isNaN(next)) {
      setLocal(String(value ?? 0));
      return;
    }
    setLocal(String(next));
    if (next !== Number(value)) onCommit(next);
  };

  return (
    <Input
      className={className}
      type="number"
      step={step}
      disabled={disabled}
      value={local}
      onChange={(e) => {
        dirty.current = true;
        setLocal(e.target.value);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

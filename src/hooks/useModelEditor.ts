import { useEffect, useState } from "react";
import { useDeal } from "@/context/DealContext";
import { useSaveScenarioModel, useScenarioModel } from "@/hooks/useDealData";
import type { ModelKey } from "@/types/deal";

export function useModelEditor<T extends object>(key: ModelKey) {
  const { activeScenarioId, canEdit } = useDeal();
  const { data, isLoading } = useScenarioModel<T>(activeScenarioId, key);
  const save = useSaveScenarioModel(activeScenarioId, key);
  const [model, setModel] = useState<T | null>(null);

  useEffect(() => {
    if (data) setModel(data);
  }, [data]);

  const update = (changes: Partial<T>) => setModel((prev) => (prev ? { ...prev, ...changes } : prev));

  return {
    model,
    update,
    isLoading: isLoading || !model,
    canEdit,
    dirty: !!model && !!data && JSON.stringify(model) !== JSON.stringify(data),
    save: () => model && save.mutate(model),
    saving: save.isPending,
  };
}

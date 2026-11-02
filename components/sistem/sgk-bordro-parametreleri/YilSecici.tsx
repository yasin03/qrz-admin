"use client";

import { useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useYearOptions } from "@/constants/data";

/**
 * useYearOptions üzerine: gelecek yılın parametreleri önceden girilebilsin
 * diye bir sonraki yıl dahil son 12 yıl, yeniden eskiye. Listede olmayan
 * yıllar (örn. kayıttaki yıl, aktarım hedefi) eklenir.
 */
export function useYilOptions(...extra: string[]) {
  const years = useYearOptions(12, 1);
  const extraKey = extra.filter(Boolean).join(",");

  return useMemo(
    () =>
      Array.from(new Set([...years, ...extraKey.split(",").filter(Boolean)]))
        .sort((a, b) => Number(b) - Number(a))
        .map((y) => ({ value: y, label: y })),
    [years, extraKey],
  );
}

type Props = {
  value: string;
  onChange: (yil: string) => void;
};

/** Liste toolbar'ının sağ üstündeki yıl seçimi. */
const YilSecici = ({ value, onChange }: Props) => {
  const yilOptions = useYilOptions(value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-24" aria-label="Yıl">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {yilOptions.map((y) => (
          <SelectItem key={y.value} value={y.value}>
            {y.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default YilSecici;

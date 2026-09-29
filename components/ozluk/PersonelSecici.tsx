"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { useAktifPersonelListesi } from "@/hooks/use-personel";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";

type Props = {
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
};

type PersonelOption = { value: string; label: string; SicilNo: string };

const PersonelSecici = ({ value, onChange, className }: Props) => {
  const [open, setOpen] = useState(false);
  const { data: personelListesi = [], isLoading } = useAktifPersonelListesi();

  const options = useMemo<PersonelOption[]>(
    () =>
      personelListesi.map((p) => ({
        value: String(p.IDSubePersonel),
        label: String(p.AdSoyad ?? "").trim(),
        SicilNo: String(p.SicilNo ?? ""),
      })),
    [personelListesi],
  );

  const optionMap = useMemo(
    () => new Map(options.map((o) => [o.value, o])),
    [options],
  );

  const selected = value ? optionMap.get(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          appearance="outline"
          variant="secondary"
          disabled={isLoading}
          className={cn(
            "w-full justify-between font-normal sm:w-80",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {isLoading
              ? "Personeller yükleniyor..."
              : selected
                ? `${selected.label} · ${selected.SicilNo}`
                : "Personel seçiniz"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[--radix-popover-trigger-width] min-w-72 p-0"
      >
        <Command
          filter={(itemValue, search) => {
            const item = optionMap.get(itemValue);
            if (!item) return 0;
            const haystack = `${item.label} ${item.SicilNo}`.toLocaleLowerCase(
              "tr-TR",
            );
            return haystack.includes(search.toLocaleLowerCase("tr-TR")) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="İsim veya sicil no ile ara..." />
          <CommandList>
            <CommandEmpty>Personel bulunamadı.</CommandEmpty>
            <CommandGroup>
              {options.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.SicilNo}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default PersonelSecici;

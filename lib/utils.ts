import { clsx, type ClassValue } from "clsx";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const normalize = (text?: string | null) =>
  (text ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u");

export const text = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

export const formatPhone = (value: unknown): string | null => {
  const str = text(value);
  if (!str) return null;
  const digits = str.replace(/\D/g, "");
  if (digits.length !== 10) return str;
  return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
};

export const formatIban = (value: unknown): string | null => {
  const str = text(value);
  return str
    ? str
        .replace(/\s/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim()
    : null;
};

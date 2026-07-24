"use client";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  loading: boolean;
  text?: string;
};

export function FormSubmitButton({
  loading,
  text = "Kaydet",
}: Props) {
  return (
    <Button
      type="submit"
      disabled={loading}
    >
      {loading && (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      )}

      {loading ? "Kaydediliyor..." : text}
    </Button>
  );
}
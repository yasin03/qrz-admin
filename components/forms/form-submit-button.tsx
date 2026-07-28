"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormSubmitButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "type"
> & {
  /** true iken spinner gösterir ve butonu disable eder. */
  loading?: boolean;
};

/**
 *   <FormSubmitButton loading={isPending} />                    // "Kaydet"
 *   <FormSubmitButton loading={isPending}>Güncelle</FormSubmitButton>
 *   <FormSubmitButton loading={isPending}><Save className="size-4" />Kaydet</FormSubmitButton>
 */
export function FormSubmitButton({
  loading = false,
  disabled,
  children,
  className,
  color = "primary",
  appearance = "solid",
  ...props
}: FormSubmitButtonProps) {
  return (
    <Button
      type="submit"
      color={color}
      appearance={appearance}
      disabled={disabled || loading}
      className={cn("gap-2", className)}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children ?? "Kaydet"}
    </Button>
  );
}

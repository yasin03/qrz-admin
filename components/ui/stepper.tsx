"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type StepperStep = {
  id: string;
  label: string;
  /** Adımda hatalı/eksik alan varsa adım kırmızı gösterilir. */
  hasError?: boolean;
};

type StepperProps = {
  steps: readonly StepperStep[];
  /** Aktif adımın index'i (0'dan başlar). */
  activeStep: number;
  /** Verilmezse adımlar tıklanamaz, sadece gösterge olarak çalışır. */
  onStepClick?: (index: number) => void;
  /** Hangi adımlara tıklanabileceği. Verilmezse hepsine tıklanabilir. */
  isStepClickable?: (index: number) => boolean;
  className?: string;
};

/**
 * Yatay adım göstergesi (1 → 2 → 3 ...). Sadece göstergedir; adım state'i,
 * doğrulama ve İleri/Geri butonları kullanan tarafta yönetilir.
 * Mobilde sadece aktif adımın etiketi görünür.
 */
export function Stepper({
  steps,
  activeStep,
  onStepClick,
  isStepClickable,
  className,
}: StepperProps) {
  return (
    <nav aria-label="Adımlar" className={cn("w-full", className)}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          const isLast = index === steps.length - 1;
          const clickable =
            Boolean(onStepClick) &&
            !isActive &&
            (isStepClickable?.(index) ?? true);

          return (
            <li
              key={step.id}
              className={cn("flex min-w-0 items-center", !isLast && "flex-1")}
            >
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepClick?.(index)}
                aria-current={isActive ? "step" : undefined}
                className="group/step flex min-w-0 items-center gap-2 rounded-md p-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 enabled:cursor-pointer disabled:cursor-default"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    isActive &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary/10 text-primary",
                    !isActive &&
                      !isCompleted &&
                      "border-border bg-background text-muted-foreground",
                    step.hasError &&
                      !isActive &&
                      "border-destructive bg-destructive/10 text-destructive",
                    clickable && "group-hover/step:border-primary",
                  )}
                >
                  {isCompleted && !step.hasError ? (
                    <Check className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    isActive ? "inline text-foreground" : "hidden sm:inline",
                    !isActive && "text-muted-foreground",
                    step.hasError && "text-destructive",
                  )}
                >
                  {step.label}
                  {step.hasError && (
                    <span className="sr-only"> (hatalı/eksik alan var)</span>
                  )}
                </span>
              </button>
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-2 h-px min-w-4 flex-1 bg-border",
                    isCompleted && "bg-primary",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

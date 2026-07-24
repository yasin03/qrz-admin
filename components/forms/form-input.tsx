"use client";

import { ReactNode } from "react";
import {
  Controller,
  Control,
  FieldPath,
  FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";

import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;

  label: string;

  placeholder?: string;

  type?: React.HTMLInputTypeAttribute;

  required?: boolean;

  disabled?: boolean;

  readOnly?: boolean;

  description?: string;

  className?: string;

  inputClassName?: string;

  autoComplete?: string;

  maxLength?: number;

  startIcon?: ReactNode;

  endIcon?: ReactNode;
};

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  required,
  disabled,
  readOnly,
  description,
  className,
  inputClassName,
  autoComplete,
  maxLength,
  startIcon,
  endIcon,
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <Label htmlFor={name}>
            {label}

            {required && (
              <span className="ml-1 text-destructive">*</span>
            )}
          </Label>

          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}

          <div className="relative">

            {startIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {startIcon}
              </div>
            )}

            <Input
              {...field}
              id={name}
              value={field.value ?? ""}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              autoComplete={autoComplete}
              maxLength={maxLength}
              className={cn(
                startIcon && "pl-10",
                endIcon && "pr-10",
                inputClassName
              )}
            />

            {endIcon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {endIcon}
              </div>
            )}
          </div>

          {fieldState.error && (
            <p className="text-sm text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </Field>
      )}
    />
  );
}
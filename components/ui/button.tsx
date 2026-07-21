import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      color: {
        primary: "",
        secondary: "",
        success: "",
        warning: "",
        danger: "",
        info: "",
      },
      appearance: {
        solid: "",
        outline: "bg-background",
        ghost: "",
        link: "h-auto rounded-none p-0",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    compoundVariants: [
      // ---- solid (dolu zemin, bootstrap'taki .btn-primary vb.) ----
      {
        color: "primary",
        appearance: "solid",
        class: "bg-primary text-primary-foreground hover:bg-primary/85",
      },
      {
        color: "secondary",
        appearance: "solid",
        class: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      {
        color: "success",
        appearance: "solid",
        class: "bg-success text-success-foreground hover:bg-success/85",
      },
      {
        color: "warning",
        appearance: "solid",
        class: "bg-warning text-warning-foreground hover:bg-warning/85",
      },
      {
        color: "danger",
        appearance: "solid",
        class:
          "bg-destructive text-destructive-foreground hover:bg-destructive/85",
      },
      {
        color: "info",
        appearance: "solid",
        class: "bg-info text-info-foreground hover:bg-info/85",
      },

      // ---- outline (renkli kenarlık + renkli metin, şeffaf zemin) ----
      {
        color: "primary",
        appearance: "outline",
        class: "border-primary/40 text-primary hover:bg-primary/10",
      },
      {
        color: "secondary",
        appearance: "outline",
        class:
          "border-secondary-foreground/25 text-secondary-foreground hover:bg-secondary",
      },
      {
        color: "success",
        appearance: "outline",
        class: "border-success/40 text-success hover:bg-success/10",
      },
      {
        color: "warning",
        appearance: "outline",
        class: "border-warning/50 text-warning hover:bg-warning/10",
      },
      {
        color: "danger",
        appearance: "outline",
        class: "border-destructive/40 text-destructive hover:bg-destructive/10",
      },
      {
        color: "info",
        appearance: "outline",
        class: "border-info/40 text-info hover:bg-info/10",
      },

      // ---- ghost (kenarlık yok, sadece hover'da zemin) ----
      {
        color: "primary",
        appearance: "ghost",
        class: "text-primary hover:bg-primary/10",
      },
      {
        color: "secondary",
        appearance: "ghost",
        class: "text-secondary-foreground hover:bg-secondary",
      },
      {
        color: "success",
        appearance: "ghost",
        class: "text-success hover:bg-success/10",
      },
      {
        color: "warning",
        appearance: "ghost",
        class: "text-warning hover:bg-warning/10",
      },
      {
        color: "danger",
        appearance: "ghost",
        class: "text-destructive hover:bg-destructive/10",
      },
      {
        color: "info",
        appearance: "ghost",
        class: "text-info hover:bg-info/10",
      },

      // ---- link (sadece metin + alt çizgi) ----
      {
        color: "primary",
        appearance: "link",
        class: "text-primary underline-offset-4 hover:underline",
      },
      {
        color: "secondary",
        appearance: "link",
        class: "text-secondary-foreground underline-offset-4 hover:underline",
      },
      {
        color: "success",
        appearance: "link",
        class: "text-success underline-offset-4 hover:underline",
      },
      {
        color: "warning",
        appearance: "link",
        class: "text-warning underline-offset-4 hover:underline",
      },
      {
        color: "danger",
        appearance: "link",
        class: "text-destructive underline-offset-4 hover:underline",
      },
      {
        color: "info",
        appearance: "link",
        class: "text-info underline-offset-4 hover:underline",
      },
    ],
    defaultVariants: {
      color: "primary",
      appearance: "solid",
      size: "default",
    },
  },
);

function Button({
  className,
  color = "primary",
  appearance = "solid",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-color={color}
      data-appearance={appearance}
      data-size={size}
      className={cn(buttonVariants({ color, appearance, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
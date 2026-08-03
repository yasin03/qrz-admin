"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

type FormLabelProps = {
  label: string;
  required?: boolean;
  description?: string;
  className?: string;
  /**
   * true verilirse label sola (~%25), children sağa (~%75) hizalanır —
   * diğer form component'leriyle (FormInput, FormSelect, FormSwitch) aynı
   * vertical davranışı. Varsayılan false: label üstte, children altta.
   */
  vertical?: boolean;
  /** Label'ın altında/yanında istediğin herhangi bir şey — örn. iki ayrı <Input>. */
  children: ReactNode;
};

/**
 * Tek bir label'ın birden fazla input'u (kendi label'ı olmadan) kapsaması
 * gerektiğinde kullan — örn. "Ad Soyad" tek başlık, altında/yanında iki
 * ayrı <Input> (Ad + Soyad).
 *
 *   <FormLabel label="Ad Soyad" required>
 *     <div className="grid grid-cols-2 gap-3">
 *       <Input {...register("Ad")} placeholder="Ad" />
 *       <Input {...register("Soyad")} placeholder="Soyad" />
 *     </div>
 *   </FormLabel>
 *
 * react-hook-form'a bağlı DEĞİL — içine ne koyarsan (Controller ile sarılı
 * bir input, plain <Input>, başka bir şey) onu kendi state/binding'iyle
 * sen yönetiyorsun. FormLabel sadece başlık + hizalama sağlıyor.
 */
export function FormLabel({
  label,
  required,
  description,
  className,
  vertical = true,
  children,
}: FormLabelProps) {
  const labelNode = (
    <Label className={cn(vertical && "w-1/4 shrink-0")}>
      {label}
      {required && <span className="ml-1 text-destructive">*</span>}
    </Label>
  );

  // Children her zaman flex-row + eşit genişlik: birden fazla input
  // (örn. Adı + Soyadı) koyduğunda otomatik yan yana, eşit paylaşımlı
  // dizilir. [&>*]:flex-1 -> doğrudan her çocuğa flex-1 uygular, ayrıca
  // her input'u tek tek sarmalamana gerek kalmaz.
  const childrenRow = (
    <div className="flex flex-1 items-start gap-3 [&>*]:flex-1">
      {children}
    </div>
  );

  if (vertical) {
    return (
      <Field className={cn("", className)}>
        <div className="flex items-center gap-3">
          {labelNode}
          <div className="flex flex-1 flex-col gap-1.5">
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {childrenRow}
          </div>
        </div>
      </Field>
    );
  }

  return (
    <Field className={className}>
      {labelNode}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {childrenRow}
    </Field>
  );
}
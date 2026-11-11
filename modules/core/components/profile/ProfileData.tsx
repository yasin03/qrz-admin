"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  KeyRound,
  Loader2,
  Mail,
  Save,
  Shield,
  User as UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, useAuthStore } from "@/stores/auth-store";

// ---- Şemalar -----------------------------------------------------------

const profileSchema = z.object({
  Ad: z.string().min(2, "Ad Soyad en az 2 karakter olmalı"),
  Email: z
    .string()
    .email("Geçerli bir e-posta adresi girin")
    .or(z.literal(""))
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre zorunlu"),
    newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı"),
    confirmPassword: z.string().min(1, "Şifre tekrarı zorunlu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

// ---- Yardımcılar ---------------------------------------------------------

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// TODO: kendi endpoint'lerinle değiştir
async function updateProfile(values: ProfileFormValues) {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error("Profil güncellenemedi");
  return res.json();
}

async function changePassword(
  values: Omit<PasswordFormValues, "confirmPassword">,
) {
  const res = await fetch("/api/profile/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error("Şifre değiştirilemedi");
  return res.json();
}

// ---- Bileşen -------------------------------------------------------------

const ProfileData = () => {
  const user = useUser();
  const updateUser = useAuthStore((state) => state.updateUser);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { Ad: user?.Ad ?? "", Email: user?.Email ?? "" },
  });

  // Store'daki kullanıcı değişirse (örn. sayfa yenilenip hydrate olduğunda) formu senkronla
  useEffect(() => {
    if (user) resetProfile({ Ad: user.Ad, Email: user.Email ?? "" });
  }, [user, resetProfile]);

  const { mutateAsync: submitProfile, isPending: isSavingProfile } =
    useMutation({ mutationFn: updateProfile });

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      await submitProfile(values);
      updateUser(values);
      toast.success("Profil güncellendi");
      resetProfile(values);
    } catch {
      toast.error("Profil güncellenemedi", {
        description: "Lütfen daha sonra tekrar deneyin.",
      });
    }
  };

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { mutateAsync: submitPassword, isPending: isSavingPassword } =
    useMutation({ mutationFn: changePassword });

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      await submitPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Şifre başarıyla değiştirildi");
      resetPassword();
    } catch {
      toast.error("Şifre değiştirilemedi", {
        description: "Mevcut şifrenizi doğru girdiğinizden emin olun.",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const accountFields = [
    { label: "Kullanıcı Tipi", value: user.KullaniciTipi, icon: Shield },
    {
      label: "Firma",
      value: user.IDFirma ? `#${user.IDFirma}` : null,
      icon: Building2,
    },
    {
      label: "Şirket",
      value: user.IDSirket ? `#${user.IDSirket}` : null,
      icon: Building2,
    },
    {
      label: "Şube",
      value: user.IDSube ? `#${user.IDSube}` : null,
      icon: Building2,
    },
  ].filter((field) => field.value);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profil başlığı */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
          {getInitials(user.Ad)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {user.Ad}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {user.Email || "E-posta belirtilmemiş"}
          </p>
          <span className="mt-1.5 inline-flex items-center rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
            {user.KullaniciTipi}
          </span>
        </div>
      </div>

      {/* Kişisel bilgiler */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            Kişisel Bilgiler
          </h2>
          <p className="text-sm text-muted-foreground">
            Ad soyad ve iletişim bilgilerinizi güncelleyin.
          </p>
        </div>

        <form
          onSubmit={handleProfileSubmit(onProfileSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="Ad">Ad Soyad</Label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="Ad"
                  className="pl-9"
                  aria-invalid={!!profileErrors.Ad}
                  {...registerProfile("Ad")}
                />
              </div>
              {profileErrors.Ad && (
                <p className="text-xs text-destructive">
                  {profileErrors.Ad.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="Email">E-posta</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="Email"
                  type="email"
                  className="pl-9"
                  placeholder="ornek@sirket.com"
                  aria-invalid={!!profileErrors.Email}
                  {...registerProfile("Email")}
                />
              </div>
              {profileErrors.Email && (
                <p className="text-xs text-destructive">
                  {profileErrors.Email.message}
                </p>
              )}
            </div>
          </div>

          {accountFields.length > 0 && (
            <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
              {accountFields.map(({ label, value, icon: Icon }) => (
                <div key={label} className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {label}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Icon className="size-4 text-muted-foreground" />
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              color="secondary"
              appearance="ghost"
              disabled={!isProfileDirty}
              onClick={() =>
                resetProfile({ Ad: user.Ad, Email: user.Email ?? "" })
              }
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={!isProfileDirty || isSavingProfile}>
              {isSavingProfile ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Kaydet
            </Button>
          </div>
        </form>
      </div>

      {/* Şifre değiştir */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            Şifre Değiştir
          </h2>
          <p className="text-sm text-muted-foreground">
            Hesabınızın güvenliği için güçlü bir şifre seçin.
          </p>
        </div>

        <form
          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Mevcut Şifre</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="currentPassword"
                type="password"
                className="pl-9"
                aria-invalid={!!passwordErrors.currentPassword}
                {...registerPassword("currentPassword")}
              />
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-xs text-destructive">
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input
                id="newPassword"
                type="password"
                aria-invalid={!!passwordErrors.newPassword}
                {...registerPassword("newPassword")}
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
              <Input
                id="confirmPassword"
                type="password"
                aria-invalid={!!passwordErrors.confirmPassword}
                {...registerPassword("confirmPassword")}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit" color="danger" disabled={isSavingPassword}>
              {isSavingPassword ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Şifreyi Güncelle
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileData;

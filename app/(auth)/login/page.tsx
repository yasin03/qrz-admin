"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/services/auth";
import { useAuthStore, User } from "@/stores/auth-store";
import { FormInput, FormSwitch } from "@/components/forms";

const loginSchema = z.object({
  username: z.string(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Page = () => {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", remember: false },
  });

  const { mutateAsync: loginMutation, isPending } = useMutation({
    mutationFn: login,
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const data = await loginMutation(values);
      if (String(data?.Sonuc ?? "") != "1") {
        toast.error("Giris basarisiz", {
          description:
            (data?.message as string) || "Kullanici adi veya sifre hatali.",
        });
        return;
      }
      setUser(data as unknown as User);
      const displayName = data?.Ad || values.username;

      toast.success("Giriş başarılı", {
        description: `Hos geldiniz, ${displayName}`,
      });

      router.push("/");
    } catch (error: any) {
      toast.error("Giriş başarısız", {
        description:
          error?.response?.data?.message || "Kullanıcı adı veya şifre hatalı.",
      });
    }
  };

  return (
    <div className="grid min-h-screen">
      <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-sidebar-accent">
        {/* Dekoratif ışık lekeleri */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-info/25 blur-3xl lg:size-96"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 size-64 rounded-full bg-info/10 blur-3xl lg:size-80"
        />

        {/* İnce nokta deseni */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 3px, transparent 1px)",
            backgroundSize: "24px 24px",
            color: "var(--sidebar-foreground)",
          }}
        />

        {/* Üst alan */}
        <div className="relative z-10 p-5 lg:p-10">
          <div className="relative h-8 w-32 lg:h-10 lg:w-40" />
        </div>

        {/* Form */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
          <Card className="w-full max-w-sm p-6 shadow-lg sm:p-8 lg:max-w-md lg:p-10">
            <div className="mb-6 flex justify-center sm:mb-8">
              <div className="relative h-24 w-full sm:h-28 lg:h-36">
                <Image
                  src="/logos/logo-big.png"
                  alt="Logo"
                  fill
                  sizes="(min-width: 1024px) 448px, 100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="mb-6 space-y-1.5 text-center sm:mb-8">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Giriş yap
              </h2>

              <p className="text-sm text-muted-foreground">
                Devam etmek için hesap bilgilerinizi girin.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormInput
                control={control}
                name="username"
                label="Kullanıcı Adı"
                autoComplete="username"
                vertical={false}
                startIcon={
                  <Mail className="pointer-events-none size-4 text-muted-foreground" />
                }
              />

              <FormInput
                control={control}
                name="password"
                label="Şifre"
                type="password"
                vertical={false}
                autoComplete="current-password"
                placeholder="••••••••"
                startIcon={
                  <Lock className="pointer-events-none size-4 text-muted-foreground" />
                }
              />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FormSwitch
                    control={control}
                    name="remember"
                    className="p-0"
                  />

                  <span className="text-sm text-muted-foreground text-nowrap">
                    Beni hatırla
                  </span>
                </div>

                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-info hover:underline"
                >
                  Şifremi unuttum?
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                color="primary"
                appearance="solid"
                className="w-full"
                disabled={isPending}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Giriş yapılıyor..." : "Giriş yap"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground sm:mt-8">
              Hesabınız yok mu? Yöneticinizle iletişime geçin.
            </p>
          </Card>
        </div>

        {/* Footer */}
        <div className="relative z-10 p-5 text-center text-xs text-sidebar-foreground/50 lg:p-10">
          © {new Date().getFullYear()} QR-Zaman. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
};

export default Page;

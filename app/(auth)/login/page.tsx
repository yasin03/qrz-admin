"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/services/auth";
import { useAuthStore, User } from "@/stores/auth-store";

const loginSchema = z.object({
  username: z.string(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Page = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
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
        console.log("Login response:", data); // Log the response for debugging
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
      <div className="relative hidden overflow-hidden bg-sidebar-accent lg:flex lg:flex-col lg:justify-between">
        {/* Dekoratif ışık lekeleri */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-info/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 size-80 rounded-full bg-info/10 blur-3xl"
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

        <div className="relative z-10 p-10">
          <div className="relative h-10 w-40"></div>
        </div>
        {/* form */}
        <div className="flex items-center justify-center z-3">
          <Card className="w-full max-w-sm p-7 shadow-lg lg:max-w-md lg:p-10">
            <div className="mb-8 flex justify-center">
              <div className="relative h-36 w-full">
                <Image
                  src="/logos/logo-big.png"
                  alt="Logo"
                  fill
                  sizes="(min-width: 768px) 448px, 100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="mb-8 space-y-1.5 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
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
              <div className="space-y-1.5">
                <Label htmlFor="email">Kullanıcı Adı</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    autoComplete="username"
                    className="pl-9"
                    aria-invalid={!!errors.username}
                    {...register("username")}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Şifre</Label>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-9 pl-9"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Şifreyi gizle" : "Şifreyi göster"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name="remember"
                    render={({ field }) => (
                      <Checkbox
                        id="remember"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal text-muted-foreground"
                  >
                    Beni hatırla
                  </Label>
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

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Hesabınız yok mu? Yöneticinizle iletişime geçin.
            </p>
          </Card>
        </div>

        <div className="relative z-10 p-10 text-xs text-sidebar-foreground/50 text-center">
          © {new Date().getFullYear()} QR-Zaman. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
};

export default Page;

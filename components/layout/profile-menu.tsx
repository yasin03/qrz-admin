"use client";

import { useState } from "react";
import {
  Building,
  Building2,
  ChevronDown,
  LogOut,
  User,
  UserCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";

const ProfileMenu = () => {
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      clearUser();
      setIsLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" appearance="ghost" className="gap-2">
          <UserCircle2 className="size-5" />

          <span className="hidden sm:inline">{user?.Ad ?? "Kullanıcı"}</span>

          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User /> Profil Bilgileri
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/kurumsal")}>
          <Building /> Kurumsal Bilgiler
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Building2 /> Kurumsal Ayarlar
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={isLoggingOut}
          onClick={handleLogout}
        >
          <LogOut />
          {isLoggingOut ? "Çıkış Yapılıyor..." : "Çıkış Yap"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;

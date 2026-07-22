import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// API'nin döndüğü kullanıcı objesiyle birebir eşleşen tip.
// "Sonuc" giriş sonucunu belirten bir bayrak olduğu için user tipine dahil
// etmiyoruz, sadece store'a yazmadan önce kontrol ediyoruz.
export type User = {
  Ad: string;
  IDKullaniciTip: string;
  Klasor: string | null;
  IDFirma: number;
  KullaniciTipi: string;
  Aciklama: string | null;
  IDIliski: string | null;
  IDKullanici: string;
  MuhasebeYetki: string | null;
  IDSirket: number | null;
  IDSube: number | null;
  IDSubePersonel: number | null;
  SifreDegistir: boolean;
  Email: string | null;
};

type AuthState = {
  user: User | null;
  /** persist middleware localStorage'dan veriyi henüz geri yüklemediyse false. */
  hasHydrated: boolean;
};

type AuthActions = {
  setUser: (user: User) => void;
  updateUser: (patch: Partial<User>) => void;
  clearUser: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,

      setUser: (user) => set({ user }),

      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        })),

      clearUser: () => set({ user: null }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // Sadece user'ı diske yaz; hasHydrated her zaman runtime'da hesaplanmalı.
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// ---- Kullanışlı selector hook'ları -------------------------------------
// Component'lerde `useAuthStore((s) => s.user)` yazmak yerine bunları
// kullanabilirsin — aynı şey, sadece daha kısa ve tutarlı.

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.user !== null);
export const useAuthHasHydrated = () =>
  useAuthStore((state) => state.hasHydrated);

// ---- Kullanım örnekleri ------------------------------------------------
/* import { useAuthStore, useUser } from "@/stores/auth-store";

// tüm store'a erişim
const user = useAuthStore((state) => state.user);

// veya kısayol
const user = useUser();

// sadece IDFirma lazımsa, gereksiz re-render'ları önlemek için:
const idFirma = useAuthStore((state) => state.user?.IDFirma); */
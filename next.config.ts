import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev sunucusuna yerel ağdaki IP'den (telefon vb.) erişirken HMR websocket'i engellenmesin
  allowedDevOrigins: ["192.168.1.106"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // hanya impor ikon yang dipakai (tanpa ini dev compile ~13 ribu modul per halaman)
  experimental: { optimizePackageImports: ["@phosphor-icons/react"] },
};

export default nextConfig;

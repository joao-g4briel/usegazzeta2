import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob (fotos dos produtos)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Cloudinary, caso seja a opção de armazenamento escolhida
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;

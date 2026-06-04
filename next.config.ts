import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "search1.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "thumbnail.image.kakaocdn.net", // 카카오 책 표지
      },
    ],
  },
};

export default nextConfig;

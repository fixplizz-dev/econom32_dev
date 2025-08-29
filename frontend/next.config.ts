import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://api.econom32.ru' 
      : 'http://localhost:3002'
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  },
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru'
  }
};

export default nextConfig;

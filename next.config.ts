import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker self-hosting
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Allow large document uploads (scans, PDFs)
    },
  },
};

export default withNextIntl(nextConfig);

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js dev badge so it doesn't show up in the demo recording
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

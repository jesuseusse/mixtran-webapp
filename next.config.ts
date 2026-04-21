import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Forward browser-side errors to the terminal so Claude Code can see them. */
  logging: {
    browserToTerminal: true,
  },

  /** React Compiler — stable in Next.js 16.2. Optimises re-renders automatically. */
  reactCompiler: true,

  /** Allow next/image to load media from the CloudFront CDN. */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

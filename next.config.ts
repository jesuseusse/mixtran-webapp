import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Forward browser-side errors to the terminal so Claude Code can see them. */
  logging: {
    browserToTerminal: true,
  },

  /** React Compiler — stable in Next.js 16.2. Optimises re-renders automatically. */
  reactCompiler: true,
};

export default nextConfig;

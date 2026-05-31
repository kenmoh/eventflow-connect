// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  server: {
   
    headers: {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.accounts.dev https://eventflow-connect.kenneth-aremoh.workers.dev https://*.clerk.com https://clerk.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: https://img.clerk.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.resend.com https://api.paystack.co https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.accounts.dev https://*.neon.tech https://eventflow-connect.kenneth-aremoh.workers.dev https://*.clerk.com https://clerk.com; frame-src https://checkout.paystack.com https://*.clerk.accounts.dev https://*.accounts.dev https://eventflow-connect.kenneth-aremoh.workers.dev https://*.clerk.com https://clerk.com; media-src 'self';",
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    viteReact(),
  ],
});

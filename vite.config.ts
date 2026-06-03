// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import netlify from '@netlify/vite-plugin-tanstack-start'

export default defineConfig({
  server: {
    headers: {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://*.vercel.app https://*.netlify.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.resend.com https://api.paystack.co https://*.neon.tech https://*.vercel.app https://*.netlify.app; frame-src https://checkout.paystack.com https://*.vercel.app https://*.netlify.app; media-src 'self';",
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      tsr: {
        quoteStyle: 'single',
      },
      react: {
        babel: {
          plugins: [],
        },
      },
    }),
    netlify(),
    viteReact(),
  ],
});




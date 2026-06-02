/// <reference types="vite/client" />
import "../index.css";
import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrandingEffects } from "@/lib/store";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import { ClerkProvider } from "@clerk/tanstack-react-start";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AB Consult — Book Events. Rent Equipment." },
      { name: "description", content: "AB Consult - Professional event venue booking and equipment rental services. Book hotels, event halls, and rent premium equipment for your events." },
      { name: "keywords", content: "event venue, hotel booking, equipment rental, event hall, conference room, party equipment, Nigeria events" },
      { name: "theme-color", content: "#1A1A1A" },
      { name: "geo.region", content: "NG" },
      { name: "geo.country", content: "Nigeria" },
      
      { property: "og:title", content: "AB Consult — Book Events. Rent Equipment." },
      { property: "og:description", content: "Professional event venue booking and equipment rental services." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://eventflow-connect.kenneth-aremoh.workers.dev" },
      { property: "og:site_name", content: "AB Consult" },
      { property: "og:image", content: "https://eventflow-connect.kenneth-aremoh.workers.dev/og-image.jpg" },
      
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AB Consult — Book Events. Rent Equipment." },
      { name: "twitter:description", content: "Professional event venue booking and equipment rental services." },
      { name: "twitter:image", content: "https://eventflow-connect.kenneth-aremoh.workers.dev/og-image.jpg" },
      
      { name: "robots", content: "index, follow" },
      { name: "author", content: "AB Consult" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
      { rel: "canonical", href: "https://eventflow-connect.kenneth-aremoh.workers.dev" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "AB Consult",
          "url": "https://eventflow-connect.kenneth-aremoh.workers.dev",
          "description": "Professional event venue booking and equipment rental services in Nigeria.",
          "areaServed": { "@type": "Country", "name": "Nigeria" },
          "serviceType": ["Hotel Venue Booking", "Event Equipment Rental", "Conference Hall Rental"],
        }),
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const pk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!pk) {
    console.error("[Clerk] Missing VITE_CLERK_PUBLISHABLE_KEY in environment!");
  }

  return (
    <RootDocument>
      <ClerkProvider 
        publishableKey={pk}
        signInUrl="/admin"
        signUpUrl="/admin"
        afterSignInUrl="/admin/revenue"
        afterSignUpUrl="/admin/revenue"
      >
        <QueryClientProvider client={queryClient}>
          <ConfirmProvider>
            <TooltipProvider>
              <BrandingEffects />
              <Toaster />
              <Sonner />
              <Outlet />
            </TooltipProvider>
          </ConfirmProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jarvis — Privacy-First Voice & Vision AI Assistant",
  description: "An advanced, highly intelligent, privacy-first personal AI assistant and vision companion powered by LiveKit, Ollama, and local speech models.",
  keywords: ["AI Assistant", "Privacy-First AI", "LiveKit", "Ollama", "Local LLM", "Voice AI", "Vision AI"],
  authors: [{ name: "Jarvis AI" }],
  openGraph: {
    title: "Jarvis — Privacy-First Voice & Vision AI Assistant",
    description: "An advanced, highly intelligent, privacy-first personal AI assistant and vision companion.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jarvis — Privacy-First Voice & Vision AI Assistant",
    description: "An advanced, highly intelligent, privacy-first personal AI assistant and vision companion.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jarvis",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8dfd0" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem themes={["dark", "neon", "light", "system"]}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

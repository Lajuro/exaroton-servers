import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "MineServerManager",
  description: "Manage your Minecraft servers hosted on Exaroton",
  icons: {
    icon: '/logo_msm.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          @media (prefers-color-scheme: light) {
            link[rel="icon"] {
              filter: invert(1);
            }
          }
        `}} />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

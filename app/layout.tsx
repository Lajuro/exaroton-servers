import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mineservermanager.online';

export const metadata: Metadata = {
  title: {
    default: "MineServerManager - Gerencie seus Servidores Minecraft",
    template: "%s | MineServerManager",
  },
  description: "Gerencie seus servidores Minecraft hospedados na Exaroton de forma simples e eficiente. Inicie, pare, monitore e controle seus servidores em tempo real.",
  keywords: [
    "minecraft",
    "servidor minecraft",
    "exaroton",
    "gerenciador de servidor",
    "minecraft server",
    "server manager",
    "hosting minecraft",
    "painel minecraft",
  ],
  authors: [{ name: "MineServerManager" }],
  creator: "MineServerManager",
  publisher: "MineServerManager",
  metadataBase: new URL(siteUrl),
  
  // Open Graph - Para Facebook, WhatsApp, LinkedIn, etc.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "MineServerManager",
    title: "MineServerManager - Gerencie seus Servidores Minecraft",
    description: "Gerencie seus servidores Minecraft hospedados na Exaroton de forma simples e eficiente. Inicie, pare, monitore e controle seus servidores em tempo real.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MineServerManager - Gerenciador de Servidores Minecraft",
        type: "image/png",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "MineServerManager - Gerencie seus Servidores Minecraft",
    description: "Gerencie seus servidores Minecraft hospedados na Exaroton de forma simples e eficiente.",
    images: ["/og-image.png"],
    creator: "@mineservermanager",
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Icons - gerados dinamicamente pelo Next.js via app/icon.tsx e app/apple-icon.tsx
  // Os arquivos icon.tsx e apple-icon.tsx geram automaticamente os favicons
  
  // Manifest
  manifest: "/manifest.json",
  
  // Outros
  applicationName: "MineServerManager",
  category: "technology",
  
  // Verification (adicione seus IDs quando tiver)
  // verification: {
  //   google: 'seu-google-site-verification',
  //   yandex: 'seu-yandex-verification',
  // },
};

// JSON-LD estruturado para SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'MineServerManager',
  applicationCategory: 'GameApplication',
  operatingSystem: 'Web Browser',
  description: 'Gerencie seus servidores Minecraft hospedados na Exaroton de forma simples e eficiente. Inicie, pare, monitore e controle seus servidores em tempo real.',
  url: 'https://mineservermanager.online',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
  },
  featureList: [
    'Gerenciamento de servidores em tempo real',
    'Controle de inicialização e parada',
    'Monitoramento de jogadores online',
    'Execução de comandos remotos',
    'Suporte a múltiplos servidores',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#4ade80" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a2e" media="(prefers-color-scheme: dark)" />
        
        {/* Mobile app meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MineServerManager" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#4ade80" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Format detection */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="theme"
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Painel de controle para gerenciar seus servidores Minecraft. Veja status, inicie, pare e monitore em tempo real.',
  openGraph: {
    title: 'Dashboard | MineServerManager',
    description: 'Painel de controle para seus servidores Minecraft',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

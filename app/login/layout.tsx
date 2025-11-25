import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Faça login no MineServerManager para gerenciar seus servidores Minecraft hospedados na Exaroton.',
  openGraph: {
    title: 'Entrar | MineServerManager',
    description: 'Faça login para gerenciar seus servidores Minecraft',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

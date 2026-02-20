export const metadata = {
  title: 'Laura Dashboard',
  description: 'Task Tracking API — GrupoUS/Laura',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

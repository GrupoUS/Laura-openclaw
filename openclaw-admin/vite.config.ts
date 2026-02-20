import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    TanStackRouterVite({
      routesDirectory: './src/client/routes',
      generatedRouteTree: './src/client/routeTree.gen.ts'
    })
  ],
  server: {
    proxy: {
      '/trpc': 'http://localhost:3000',
      '/api': 'http://localhost:3000'
    }
  },
  build: { outDir: 'dist/public' }
})

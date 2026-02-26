import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    TanStackRouterVite({
      routesDirectory: './src/client/routes',
      generatedRouteTree: './src/client/routeTree.gen.ts'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  server: {
    proxy: {
      '/trpc': 'http://localhost:3000',
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    outDir: 'dist/public',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-charts': ['recharts'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-radix': [
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-dialog',
          ],
          'vendor-query': ['@tanstack/react-query', '@trpc/client', '@trpc/react-query'],
        },
      },
    },
  }
})


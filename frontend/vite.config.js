import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// Phase 0 of docs/react-migration-plan.md: the iPad runs Safari 12.5.8,
// far below Vite's default build target. The legacy plugin transpiles
// syntax and injects usage-based language polyfills for these targets;
// it does not polyfill missing DOM/browser APIs (see Phase 0's note on
// feature-detecting those separately).
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: [
        'iOS >= 12',
        'Safari >= 12',
        'last 2 Chrome versions',
        'last 2 Firefox versions',
        'last 2 Edge versions',
      ],
      polyfills: true,
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/gym': 'http://localhost:3000',
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  esbuild: {
    jsxFactory: undefined,
    jsxFragment: undefined,
    loader: 'tsx',
    logOverride: { 'ignore-ts': 'silent' }, // иногда помогает игнорировать предупреждения
  },
})
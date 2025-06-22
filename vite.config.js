import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'copy-pocketbase',
      writeBundle() {
        // Copy pocketbase.umd.js to dist after build
        copyFileSync(
          resolve(__dirname, 'pocketbase.umd.js'),
          resolve(__dirname, 'dist/pocketbase.umd.js')
        )
      }
    }
  ],
})

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { fileURLToPath } from "url"

// Set up __dirname replacement for TypeScript/ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/automata/', // Ensures assets load correctly on GitHub Pages
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Fixes your @/ imports
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server runs on http://localhost:5173 by default.
// The backend API (Program.cs CORS policy) is already configured to allow this origin.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})

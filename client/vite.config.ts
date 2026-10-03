// import react from '@vitejs/plugin-react'
import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"
import { checker } from "vite-plugin-checker"

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  publicDir: "public",
  plugins: [
    react(),
    checker({ typescript: false, overlay: { initialIsOpen: false } }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    // Reduce memory usage during build
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
      output: {
        manualChunks: {
          // Split vendor libs to reduce main bundle size
          vendor: ["react", "react-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          antd: ["antd"],
          utils: ["lodash", "dayjs"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      // Heroku build was failing until I added src here
      // https://github.com/vitejs/vite/issues/9712
      src: path.resolve(__dirname, "src"),
      "#public": path.resolve(__dirname, "public"),
      // Components
      "#blocks": path.resolve(__dirname, "src/components/buildingBlocks"),
      "#views": path.resolve(__dirname, "src/components/views"),
      "#components": path.resolve(__dirname, "src/components"),

      "#classes": path.resolve(__dirname, "src/classes"),
      "#constants": path.resolve(__dirname, "src/constants"),
      "#contexts": path.resolve(__dirname, "src/contexts"),
      "#hooks": path.resolve(__dirname, "src/hooks"),
      "#mocks": path.resolve(__dirname, "src/mocks"),
      "#customTypes": path.resolve(__dirname, "src/types"),
      "#utils": path.resolve(__dirname, "src/utils"),
      "#assets": path.resolve(__dirname, "src/assets"),

      // Catch all
      "#": path.resolve(__dirname, "src"),
    },
  },
})

import dotenv from "dotenv"
// Load environment variables from .env file
dotenv.config()

import { createFirebaseClient } from "./serverFirebaseHelpers"

import type { Request, Response } from "express"

import cors from "cors"
import express from "express"
import path from "path"

const isProduction = process.env.PRODUCTION === "true"
const PRODUCTION_URL = "https://tidetracker-f608029edeba.herokuapp.com/"

// Initialize Express
const app = express()
app.use(express.json())

// Only serve static files if in production or if dist folder exists
const distPath = path.join(__dirname, "../../client/dist")
const shouldServeStatic = isProduction

if (shouldServeStatic) {
  app.use(express.static(distPath))
  console.log("\n✅ Serving static files from dist directory")
} else {
  console.log(
    "\n🤓 Development mode - not serving static files (run frontend dev server separately)"
  )
}

const port = process.env.PORT || 3000

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", PRODUCTION_URL],
  })
)

// Set up Firebase Admin SDK
createFirebaseClient()

const ROUTE_PREFIX = "/api"

// ROUTES
app.get(`${ROUTE_PREFIX}/someRoute`, (req: Request, res: Response) => {})

// Only serve index.html for SPA routing if we're serving static files
// In development, return a helpful message for non-API routes
if (shouldServeStatic) {
  app.use((req: Request, res: Response) => {
    res.sendFile(path.join(distPath, "index.html"))
  })
} else {
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      message: "Frontend not built - run the frontend dev server separately",
    })
  })
}

// Start server
console.log("\n✅ Everything looks good. Starting server...")
app.listen(port, () => {
  console.log(`\n✅ Server running on port ${port}`)
})

import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // PDFs de factura: ~2-5MB típico, margen hasta 10MB.
      bodySizeLimit: "10mb",
    },
  },
}

export default nextConfig

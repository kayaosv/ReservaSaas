"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/Button"

const triggerDownload = (href, filename) => {
  const a = document.createElement("a")
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export const CompartirTab = ({ slug }) => {
  const canvasRef = useRef(null)
  const [pngUrl, setPngUrl] = useState(null)
  const [svgStr, setSvgStr] = useState(null)
  const [copied, setCopied] = useState(false)

  const appUrl = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
    : ""
  const publicUrl = `${appUrl}/r/${slug}`
  const embed = `<script src="${appUrl}/widget.js" data-slug="${slug}"><\/script>`

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, publicUrl, { width: 220, margin: 1 }).catch(() => {})
    QRCode.toDataURL(publicUrl, { width: 1024, margin: 2 }).then(setPngUrl).catch(() => {})
    QRCode.toString(publicUrl, { type: "svg", margin: 2 }).then(setSvgStr).catch(() => {})
  }, [publicUrl])

  const handleSvgDownload = () => {
    if (!svgStr) return
    const blob = new Blob([svgStr], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, `${slug}-qr.svg`)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embed)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Página pública</h2>
        <p className="text-sm text-gray-500 mb-4">URL de tu restaurante para clientes</p>

        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono text-gray-700 hover:text-gray-900 break-all"
        >
          {publicUrl}
        </a>

        <div className="flex items-start gap-6 mt-6">
          <canvas ref={canvasRef} className="bg-white border border-gray-200 rounded-md" />
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              onClick={() => pngUrl && triggerDownload(pngUrl, `${slug}-qr.png`)}
              disabled={!pngUrl}
            >
              Descargar PNG
            </Button>
            <Button variant="secondary" onClick={handleSvgDownload} disabled={!svgStr}>
              Descargar SVG
            </Button>
            <p className="text-xs text-gray-400 mt-2 max-w-[180px]">
              Imprime el QR y colócalo en mesa, escaparate o carta.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Embeber en tu web</h2>
        <p className="text-sm text-gray-500 mb-4">
          Copia y pega este código en el HTML de tu web (en el sitio donde quieras que aparezca el widget).
        </p>
        <pre className="bg-gray-900 text-gray-100 rounded-md px-3 py-3 text-xs overflow-auto">
          <code>{embed}</code>
        </pre>
        <div className="mt-3">
          <Button variant="secondary" onClick={handleCopy}>
            {copied ? "✓ Copiado" : "Copiar código"}
          </Button>
        </div>
      </div>
    </div>
  )
}

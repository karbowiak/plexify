import { useEffect, useState } from "react"

/**
 * Detect the most visually interesting point in an image using multi-signal
 * saliency analysis on a low-resolution canvas.
 *
 * Signals (weighted):
 *  - Edge density (Sobel-like gradients on luminance) — 0.45
 *  - Local luminance contrast (3×3 neighborhood) — 0.35
 *  - Saturation (max-min RGB) — 0.20
 *  - Skin-tone boost (1.5× for pixels in common skin-tone RGB ranges)
 *  - Position bias: gentle upper-portion vertical bias + mild horizontal center bias
 *
 * Returns {x, y} in the 0–1 range, clamped to 0.10–0.90 (x) / 0.15–0.85 (y).
 * Falls back to {0.5, 0.5} on any error.
 */
export async function detectFocalPoint(imageUrl: string): Promise<{ x: number; y: number }> {
  let blobUrl: string | null = null
  try {
    const blob = await fetch(imageUrl).then(r => r.blob())
    blobUrl = URL.createObjectURL(blob)

    return await new Promise<{ x: number; y: number }>((resolve) => {
      const img = new Image()

      img.onload = () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl)

        const SIZE = 100
        const canvas = document.createElement("canvas")
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext("2d")
        if (!ctx) { resolve({ x: 0.5, y: 0.5 }); return }

        ctx.drawImage(img, 0, 0, SIZE, SIZE)
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE)

        // Pass 1: compute luminance for all pixels
        const lum = new Float32Array(SIZE * SIZE)
        for (let i = 0; i < SIZE * SIZE; i++) {
          const off = i * 4
          lum[i] = 0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2]
        }

        let weightedX = 0
        let weightedY = 0
        let totalWeight = 0

        // Pass 2: compute saliency for each pixel (skip 1px border for neighbor access)
        for (let py = 1; py < SIZE - 1; py++) {
          for (let px = 1; px < SIZE - 1; px++) {
            const idx = py * SIZE + px
            const off = idx * 4
            const r = data[off]
            const g = data[off + 1]
            const b = data[off + 2]

            // Edge density (Sobel-like gradient magnitude on luminance)
            const gx = -lum[idx - SIZE - 1] - 2 * lum[idx - 1] - lum[idx + SIZE - 1]
                       + lum[idx - SIZE + 1] + 2 * lum[idx + 1] + lum[idx + SIZE + 1]
            const gy = -lum[idx - SIZE - 1] - 2 * lum[idx - SIZE] - lum[idx - SIZE + 1]
                       + lum[idx + SIZE - 1] + 2 * lum[idx + SIZE] + lum[idx + SIZE + 1]
            const edgeMag = Math.sqrt(gx * gx + gy * gy)

            // Local luminance contrast (difference from 3×3 neighborhood mean)
            const neighborSum = lum[idx - SIZE - 1] + lum[idx - SIZE] + lum[idx - SIZE + 1]
                              + lum[idx - 1]                          + lum[idx + 1]
                              + lum[idx + SIZE - 1] + lum[idx + SIZE] + lum[idx + SIZE + 1]
            const neighborMean = neighborSum / 8
            const localContrast = Math.abs(lum[idx] - neighborMean)

            // Saturation
            const saturation = Math.max(r, g, b) - Math.min(r, g, b)

            // Skin-tone boost
            const isSkinTone = r > 80 && r > g && g > b && (r - g) > 15 && (r - b) > 25
            const skinBoost = isSkinTone ? 1.5 : 1.0

            // Position bias
            const ny = py / SIZE        // 0..1 from top
            const nx = (px / SIZE - 0.5) * 2  // -1..1 from center
            const yBias = 1.0 - 0.4 * Math.max(0, ny - 0.2)
            const xBias = 1.0 - 0.15 * Math.abs(nx)
            const posBias = xBias * yBias

            // Combine signals
            const saliency = (0.45 * edgeMag + 0.35 * localContrast + 0.20 * saturation) * skinBoost
            const weight = saliency * posBias

            weightedX += px * weight
            weightedY += py * weight
            totalWeight += weight
          }
        }

        if (totalWeight === 0) { resolve({ x: 0.5, y: 0.5 }); return }

        const rawX = weightedX / totalWeight / SIZE
        const rawY = weightedY / totalWeight / SIZE
        resolve({
          x: Math.max(0.10, Math.min(0.90, rawX)),
          y: Math.max(0.15, Math.min(0.85, rawY)),
        })
      }

      img.onerror = () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl)
        resolve({ x: 0.5, y: 0.5 })
      }

      img.src = blobUrl!
    })
  } catch {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    return { x: 0.5, y: 0.5 }
  }
}

/**
 * React hook that asynchronously detects the focal point of an image and
 * returns it as a CSS background-position / object-position string.
 *
 * While loading (or if imageUrl is null) returns "50% 50%".
 */
export function useFocalPoint(imageUrl: string | null): string {
  const [pos, setPos] = useState("50% 50%")

  useEffect(() => {
    if (!imageUrl) { setPos("50% 50%"); return }
    let cancelled = false
    detectFocalPoint(imageUrl).then(({ x, y }) => {
      if (!cancelled) setPos(`${Math.round(x * 100)}% ${Math.round(y * 100)}%`)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [imageUrl])

  return pos
}

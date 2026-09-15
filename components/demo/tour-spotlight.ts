'use client'

/**
 * Thin driver.js wrapper — stage cutout only (no popover).
 * Story copy lives in DemoTourNarrator so we never stack two text layers.
 */

export type SpotlightHandle = {
  destroy: () => void
}

export async function showTourSpotlight(
  selector: string,
  options?: { overlayOpacity?: number }
): Promise<SpotlightHandle | null> {
  if (typeof window === 'undefined') return null

  const el = document.querySelector(selector)
  if (!el) return null

  // Never spotlight a full-viewport overlay — that paints a second screen on top.
  const rect = el.getBoundingClientRect()
  if (rect.width >= window.innerWidth * 0.95 && rect.height >= window.innerHeight * 0.85) {
    return null
  }

  const { driver } = await import('driver.js')
  await import('driver.js/dist/driver.css')

  const d = driver({
    popoverClass: 'fixly-driver-popover fixly-driver-popover--hidden',
    stagePadding: 8,
    stageRadius: 14,
    allowClose: false,
    // Keep soft — pro sheet already has its own dim backdrop
    overlayOpacity: options?.overlayOpacity ?? 0.28,
    smoothScroll: true,
    disableActiveInteraction: true,
  })

  // Stage highlight only — narrator owns the Hebrew story text
  d.highlight({ element: selector })

  return {
    destroy: () => {
      try {
        d.destroy()
      } catch {
        // already torn down
      }
    },
  }
}

export async function waitForSelector(
  selector: string,
  timeoutMs = 4000
): Promise<Element | null> {
  if (typeof window === 'undefined') return null
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const el = document.querySelector(selector)
    if (el) return el
    await new Promise((r) => setTimeout(r, 80))
  }
  return null
}

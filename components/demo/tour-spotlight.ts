'use client'

/**
 * Thin driver.js wrapper — spotlights for investor tour beats.
 * Loaded only while the tour runs (dynamic import keeps home path light).
 */

export type SpotlightHandle = {
  destroy: () => void
}

export async function showTourSpotlight(
  selector: string,
  title: string,
  description: string
): Promise<SpotlightHandle | null> {
  if (typeof window === 'undefined') return null

  const el = document.querySelector(selector)
  if (!el) return null

  const { driver } = await import('driver.js')
  await import('driver.js/dist/driver.css')

  const d = driver({
    popoverClass: 'fixly-driver-popover',
    stagePadding: 10,
    stageRadius: 14,
    allowClose: false,
    overlayOpacity: 0.45,
    smoothScroll: true,
    disableActiveInteraction: true,
  })

  d.highlight({
    element: selector,
    popover: {
      title,
      description,
      side: 'bottom',
      align: 'center',
      showButtons: [],
    },
  })

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

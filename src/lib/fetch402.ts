/**
 * Dispatch 'insufficient-funds' custom event — picked up by InsufficientFundsModal
 * anywhere in the dashboard layout.
 */
export function triggerInsufficientFunds(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('insufficient-funds'))
  }
}

/**
 * Dispatch 'upgrade-required' custom event — picked up by UpgradeModal
 * anywhere in the dashboard layout.
 */
export function triggerUpgradeRequired(feature?: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('upgrade-required', { detail: feature ?? '' }))
  }
}

/**
 * Drop-in replacement for fetch that automatically handles:
 * - HTTP 402: triggers InsufficientFundsModal
 * - HTTP 403 with upgrade_required: triggers UpgradeModal
 */
export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init)
  if (response.status === 402) {
    triggerInsufficientFunds()
  } else if (response.status === 403) {
    try {
      const clone = response.clone()
      const data = await clone.json()
      if (data.error === 'upgrade_required') {
        triggerUpgradeRequired(data.feature)
      }
    } catch { /* non-blocking */ }
  }
  return response
}

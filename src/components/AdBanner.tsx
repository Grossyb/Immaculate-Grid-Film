import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export function AdBanner() {
  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({})
      }
    } catch {
      // Ad blocker or not loaded yet
    }
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 mb-4">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-2151087182373075"
        data-ad-slot="7491226489"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}

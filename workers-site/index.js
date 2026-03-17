const { getAssetFromKV } = require('@cloudflare/kv-asset-handler')

// Phase 2 AEC: SharedArrayBuffer requires COOP + COEP on the document that uses it.
// Only applied to tech-demo.html — the only page with the AI voice chat widget.
//
// COOP: same-origin        — isolates the browsing context group (required for SAB)
// COEP: credentialless     — enables SAB without requiring CDN resources (Three.js / jsDelivr)
//                            to set Cross-Origin-Resource-Policy headers (which they don't).
//                            'require-corp' would block jsDelivr entirely.
// Browser support: Chrome 96+, Firefox 119+, Safari 17+ (covers all modern browsers).
const SAB_HEADERS = {
  'Cross-Origin-Opener-Policy':  'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event))
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  const isTechDemo = url.pathname === '/tech-demo.html' || url.pathname === '/tech-demo'

  let response
  try {
    response = await getAssetFromKV(event)
  } catch (e) {
    // fallback to index.html for SPA routes
    const indexReq = new Request(new URL('/index.html', url).toString(), event.request)
    response = await getAssetFromKV({ request: indexReq })
  }

  // Only inject SAB headers on the tech-demo page — adding them globally would break
  // CDN subresource loading on other pages that don't need SharedArrayBuffer.
  if (!isTechDemo) return response

  const newHeaders = new Headers(response.headers)
  for (const [key, value] of Object.entries(SAB_HEADERS)) {
    newHeaders.set(key, value)
  }
  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers:    newHeaders,
  })
}



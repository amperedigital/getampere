const { getAssetFromKV } = require('@cloudflare/kv-asset-handler')

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event))
})

async function handleEvent(event) {
  try {
    return await getAssetFromKV(event)
  } catch (e) {
    // fallback to index.html for SPA routes
    const url = new URL(event.request.url)
    const indexReq = new Request(new URL('/index.html', url).toString(), event.request)
    return await getAssetFromKV({ request: indexReq })
  }
}

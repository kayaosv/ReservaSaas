const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
}

export const corsHeaders = () => ({ ...CORS_HEADERS })

// Wrap a Response/NextResponse-like object so CORS headers are merged in.
export const withCors = (response) => {
  for (const [k, v] of Object.entries(CORS_HEADERS)) response.headers.set(k, v)
  return response
}

// Standard 204 reply for OPTIONS preflight.
export const corsPreflight = () =>
  new Response(null, { status: 204, headers: CORS_HEADERS })

// Helper to wrap Response.json with CORS in one call.
export const corsJson = (data, init = {}) => {
  const res = Response.json(data, init)
  return withCors(res)
}

import { SITE_URL, SITE_NAME } from '@/lib/seo/config'

/**
 * GET /api/v1/docs
 *
 * Interactive API documentation page powered by Swagger UI.
 * Loads the OpenAPI spec from /api/v1/openapi.json.
 */
export async function GET() {
  const specUrl = `${SITE_URL || ''}/api/v1/openapi.json`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API Documentation | ${SITE_NAME}</title>
  <meta name="description" content="Interactive API documentation for ${SITE_NAME}. Access attorney statistics, pricing data, bookings, and more." />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; }

    /* Header bar */
    .api-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: #fff;
      padding: 1.5rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .api-header h1 { font-size: 1.5rem; font-weight: 800; }
    .api-header p { color: #94a3b8; font-size: 0.875rem; }
    .api-header a { color: #60a5fa; text-decoration: none; font-size: 0.875rem; }
    .api-header a:hover { text-decoration: underline; }

    /* Attribution notice */
    .api-notice {
      max-width: 1200px;
      margin: 1rem auto;
      padding: 0.75rem 1.25rem;
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #92400e;
    }
    .api-notice strong { color: #78350f; }
    .api-notice a { color: #b45309; }

    /* Swagger UI container */
    #swagger-ui { max-width: 1200px; margin: 0 auto; padding: 0 1rem 3rem; }

    /* Swagger UI overrides for clean look */
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 1.5rem 0; }
    .swagger-ui .info .title { font-size: 0; } /* Hide duplicate title — header has it */
    .swagger-ui .scheme-container { background: transparent; box-shadow: none; padding: 0; }
    .swagger-ui .opblock-tag { font-size: 1.125rem; }

    /* Footer */
    .api-footer {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
      font-size: 0.75rem;
      border-top: 1px solid #e2e8f0;
      margin-top: 2rem;
    }
    .api-footer a { color: #64748b; }
  </style>
</head>
<body>
  <div class="api-header">
    <div>
      <h1>${SITE_NAME} API</h1>
      <p>v1.0 &mdash; Public API for attorney statistics, pricing, bookings, and more.</p>
    </div>
    <div>
      <a href="${SITE_URL || '/'}" target="_blank">&larr; Back to ${SITE_NAME}</a>
      &nbsp;&nbsp;
      <a href="${specUrl}" target="_blank">OpenAPI Spec (JSON)</a>
    </div>
  </div>

  <div class="api-notice">
    <strong>Attribution required</strong> &mdash; Any use of data from this API must include a visible link to
    <a href="${SITE_URL || ''}/attorney-statistics">${SITE_URL || ''}/attorney-statistics</a> with the mention
    &ldquo;Source: ${SITE_NAME} &mdash; Attorney Barometer&rdquo;.
  </div>

  <div id="swagger-ui"></div>

  <div class="api-footer">
    <p>&copy; ${new Date().getFullYear()} ${SITE_NAME} &mdash; All rights reserved</p>
    <p style="margin-top: 0.5rem;">
      Rate limit: 60 req/min per IP &bull; No API key required &bull;
      <a href="${SITE_URL || ''}/contact">Contact us for commercial use</a>
    </p>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "${specUrl}",
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset,
      ],
      layout: 'BaseLayout',
      deepLinking: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    })
  </script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}

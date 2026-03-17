import { SITE_URL, SITE_NAME } from '@/lib/seo/config'

/**
 * GET /api/v1/docs
 *
 * HTML documentation page for the Attorney Barometer API
 */
export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Attorney Barometer API — Documentation | ${SITE_NAME}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }
    h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; color: #0f172a; }
    h2 { font-size: 1.25rem; font-weight: 700; margin: 2rem 0 0.75rem; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    h3 { font-size: 1rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #334155; }
    p { margin-bottom: 1rem; color: #475569; }
    code { background: #f1f5f9; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875rem; color: #0f172a; }
    pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1rem; font-size: 0.8125rem; line-height: 1.7; }
    pre code { background: none; padding: 0; color: inherit; }
    .badge { display: inline-block; background: #2563eb; color: #fff; padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; }
    .badge-get { background: #16a34a; }
    .endpoint { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
    .endpoint-url { font-family: monospace; font-size: 0.875rem; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
    th { background: #f8fafc; font-weight: 600; color: #334155; }
    .warn { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .warn strong { color: #92400e; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .subtitle { color: #64748b; font-size: 1.125rem; margin-bottom: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Attorney Barometer API</h1>
    <p class="subtitle">Access aggregated statistics from ${SITE_NAME} on attorneys across the United States.</p>

    <div class="warn">
      <strong>Required attribution</strong> — Any use of data from this API must include a visible link to
      <a href="${SITE_URL}/attorney-statistics">${SITE_URL}/attorney-statistics</a> with the mention
      "Source: ${SITE_NAME} — Attorney Barometer".
    </div>

    <h2>Endpoints</h2>

    <div class="endpoint">
      <p><span class="badge badge-get">GET</span> <span class="endpoint-url">/api/v1/pricing</span></p>
      <p>Statistics by practice area, optionally filtered by location.</p>
      <h3>Parameters</h3>
      <table>
        <tr><th>Param</th><th>Type</th><th>Required</th><th>Description</th></tr>
        <tr><td><code>specialty</code></td><td>string</td><td>Yes</td><td>Practice area slug (e.g. <code>personal-injury</code>)</td></tr>
        <tr><td><code>city</code></td><td>string</td><td>No</td><td>City slug (e.g. <code>new-york</code>)</td></tr>
        <tr><td><code>state</code></td><td>string</td><td>No</td><td>State code (e.g. <code>CA</code>)</td></tr>
        <tr><td><code>region</code></td><td>string</td><td>No</td><td>Region slug (e.g. <code>west-coast</code>)</td></tr>
      </table>
      <h3>Example</h3>
      <pre><code>curl "${SITE_URL}/api/v1/pricing?specialty=personal-injury&city=new-york"</code></pre>
      <pre><code>{
  "success": true,
  "data": [{
    "specialty": "Personal Injury",
    "specialty_slug": "personal-injury",
    "city": "New York",
    "attorney_count": 1250,
    "avg_rating": 4.35,
    "review_count": 8420,
    "verification_rate": 0.4520
  }],
  "attribution": {
    "text": "Source: ${SITE_NAME} — Attorney Barometer",
    "url": "${SITE_URL}/attorney-statistics"
  }
}</code></pre>
    </div>

    <div class="endpoint">
      <p><span class="badge badge-get">GET</span> <span class="endpoint-url">/api/v1/stats</span></p>
      <p>Regional or state statistics — all practice areas in a zone.</p>
      <h3>Parameters</h3>
      <table>
        <tr><th>Param</th><th>Type</th><th>Required</th><th>Description</th></tr>
        <tr><td><code>region</code></td><td>string</td><td>No*</td><td>Region slug (e.g. <code>west-coast</code>)</td></tr>
        <tr><td><code>state</code></td><td>string</td><td>No*</td><td>State code (e.g. <code>CA</code>)</td></tr>
      </table>
      <p>* One of the two parameters is required.</p>
      <h3>Example</h3>
      <pre><code>curl "${SITE_URL}/api/v1/stats?region=new-york"</code></pre>
    </div>

    <h2>Cache</h2>
    <p>Responses are cached for 1 hour with a <code>stale-while-revalidate</code> of 24 hours.
    Data is aggregated daily from our database of 940,000+ attorneys.</p>

    <h2>Limitations</h2>
    <p>No API key required. Rate limit: 60 requests/minute per IP. Commercial use: contact us.</p>

    <h2>Available Practice Areas</h2>
    <p><code>personal-injury</code>, <code>criminal-defense</code>, <code>family-law</code>, <code>estate-planning</code>,
    <code>bankruptcy</code>, <code>immigration</code>, <code>real-estate</code>, <code>business-law</code>,
    <code>employment-law</code>, <code>intellectual-property</code>, <code>tax-law</code>, <code>civil-litigation</code>,
    <code>medical-malpractice</code>, <code>workers-compensation</code>, <code>dui-dwi</code>, <code>environmental-law</code>,
    <code>elder-law</code>, and more.</p>

    <h2>Contact</h2>
    <p>Questions? <a href="${SITE_URL}/contact">Contact us</a></p>

    <p style="margin-top: 3rem; font-size: 0.75rem; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} ${SITE_NAME} — All rights reserved
    </p>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}

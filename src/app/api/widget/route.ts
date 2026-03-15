import { SITE_URL, SITE_NAME } from '@/lib/seo/config'

/**
 * Serves a lightweight JavaScript widget that artisans can embed on their websites.
 * Creates a styled badge linking back to ServicesArtisans.
 *
 * Query params:
 * - service: artisan service slug (e.g. "plombier")
 * - ville: city slug (e.g. "paris")
 * - name: artisan/business name
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const service = searchParams.get('service') || ''
  const ville = searchParams.get('ville') || ''
  const name = searchParams.get('name') || ''

  // Build the profile link
  // Escape for safe JS string embedding
  const esc = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  const escapedName = esc(name)
  const escapedService = esc(service)
  const escapedVille = esc(ville)
  const escapedSiteName = esc(SITE_NAME)
  const escapedSiteUrl = esc(SITE_URL)

  const script = `(function(){
  var c=document.getElementById('sa-widget');
  if(!c)return;
  var s=c.getAttribute('data-service')||'${escapedService}';
  var v=c.getAttribute('data-ville')||'${escapedVille}';
  var n=c.getAttribute('data-name')||'${escapedName}';
  var cap=function(t){return t?t.charAt(0).toUpperCase()+t.slice(1).replace(/-/g,' '):''};
  var ds=cap(s);
  var dv=cap(v);
  var url='${escapedSiteUrl}'+(s&&v?'/practice-areas/'+encodeURIComponent(s)+'/'+encodeURIComponent(v):s?'/practice-areas/'+encodeURIComponent(s):'/');
  var h='<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:320px;border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.08)">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">';
  h+='<svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4L4 18h5v14h8v-8h6v8h8V18h5L20 4z" fill="#2563eb"/><path d="M28 12l-4-4v4h4z" fill="#1d4ed8"/><circle cx="30" cy="30" r="8" fill="#f59e0b"/><path d="M27 30l2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  h+='<span style="font-weight:700;font-size:14px;color:#1e293b">${escapedSiteName}</span></div>';
  if(n){h+='<div style="font-weight:600;font-size:15px;color:#0f172a;margin-bottom:4px">'+n.replace(/</g,'&lt;')+'</div>';}
  if(ds){h+='<div style="font-size:13px;color:#64748b;margin-bottom:8px">'+ds.replace(/</g,'&lt;')+(dv?' à '+dv.replace(/</g,'&lt;'):'')+'</div>';}
  h+='<a href="'+url+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#2563eb;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;transition:background 0.2s"';
  h+=' onmouseover="this.style.background=\'#1d4ed8\'" onmouseout="this.style.background=\'#2563eb\'">';
  h+='Voir le profil <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>';
  h+='<div style="margin-top:10px;font-size:10px;color:#94a3b8">Professionnel référencé sur <a href="${escapedSiteUrl}" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:none">${escapedSiteName}</a></div>';
  h+='</div>';
  c.innerHTML=h;
})();`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

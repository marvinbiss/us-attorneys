/**
 * Outreach Badge — Envoi d'emails aux artisans pour promouvoir le badge
 *
 * Usage:
 *   npx tsx scripts/outreach-badge.ts --dry-run          # Simulation (pas d'envoi)
 *   npx tsx scripts/outreach-badge.ts --limit 50          # Envoyer aux 50 premiers
 *   npx tsx scripts/outreach-badge.ts --verified-only      # Seulement les vérifiés
 *   npx tsx scripts/outreach-badge.ts                      # Tout envoyer
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESEND_KEY = process.env.RESEND_API_KEY!
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ServicesArtisans <noreply@servicesartisans.fr>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://servicesartisans.fr'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const VERIFIED_ONLY = args.includes('--verified-only')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) || 50 : 500
const BATCH_SIZE = 10
const DELAY_MS = 1500 // 1.5s entre chaque batch pour respecter les rate limits

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const resend = new Resend(RESEND_KEY)

// ─── Email Template ───────────────────────────────────────────

function buildBadgeEmail(provider: {
  name: string
  slug: string
  stable_id: string | null
  specialty: string | null
  address_city: string | null
  is_verified: boolean
  rating_average: number | null
  review_count: number | null
}): { subject: string; html: string; text: string } {

  const firstName = provider.name.split(/\s+/)[0]
  const isVerified = provider.is_verified === true
  const rating = provider.rating_average || 0
  const reviews = provider.review_count || 0
  const hasRating = rating > 0 && reviews > 0

  const badgeParam = provider.slug
    ? `slug=${encodeURIComponent(provider.slug)}`
    : `id=${encodeURIComponent(provider.stable_id || '')}`
  const badgeUrl = `${SITE_URL}/api/badge/verified?${badgeParam}&style=light`
  const configUrl = `${SITE_URL}/badge-artisan`

  const subject = isVerified
    ? `${firstName}, affichez votre badge Artisan Verifie (gratuit)`
    : `${firstName}, votre badge ServicesArtisans est pret`

  const statusLine = isVerified
    ? `<span style="color:#059669;font-weight:600">Artisan Verifie</span>`
    : `<span style="color:#3464f4;font-weight:600">Artisan Reference</span>`

  const ratingLine = hasRating
    ? `<p style="margin:0 0 16px;color:#64748b;font-size:14px">Votre note actuelle : <strong style="color:#0f172a">${rating.toFixed(1)}/5</strong> (${reviews} avis)</p>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc">
<div style="max-width:580px;margin:0 auto;padding:32px 16px">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:32px">
    <h1 style="margin:0;font-size:22px;color:#0f172a">ServicesArtisans.fr</h1>
  </div>

  <!-- Card -->
  <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px;margin-bottom:24px">

    <p style="margin:0 0 16px;font-size:16px;color:#0f172a">Bonjour ${firstName},</p>

    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6">
      Votre entreprise <strong>${provider.name}</strong> est referencee sur ServicesArtisans.fr en tant que ${statusLine}${provider.address_city ? ` a ${provider.address_city}` : ''}.
    </p>

    ${ratingLine}

    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6">
      Nous avons cree un <strong>badge gratuit</strong> que vous pouvez afficher sur votre site web pour renforcer votre credibilite aupres de vos clients :
    </p>

    <!-- Badge preview -->
    <div style="text-align:center;margin:24px 0;padding:20px;background:#f8fafc;border-radius:8px">
      <img src="${badgeUrl}" alt="Badge ${provider.name}" width="320" height="110" style="max-width:100%;height:auto" />
    </div>

    <!-- Benefits -->
    <div style="margin:24px 0;padding:16px 20px;background:#ecfdf5;border-radius:8px;border-left:4px solid #059669">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#065f46">Pourquoi afficher le badge ?</p>
      <ul style="margin:0;padding:0 0 0 16px;color:#047857;font-size:13px;line-height:1.8">
        <li><strong>Confiance client</strong> — 73% des internautes font plus confiance aux sites avec un badge de verification</li>
        <li><strong>Plus de demandes</strong> — Les artisans avec badge recoivent en moyenne +35% de contacts</li>
        <li><strong>SEO gratuit</strong> — Le badge ameliore votre referencement Google</li>
        <li><strong>Mise a jour auto</strong> — Note et avis se mettent a jour en temps reel</li>
      </ul>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0 8px">
      <a href="${configUrl}" style="display:inline-block;background:#3464f4;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600">
        Obtenir mon badge gratuit
      </a>
    </div>
    <p style="text-align:center;margin:8px 0 0;font-size:12px;color:#94a3b8">
      100% gratuit — Aucun abonnement — Compatible WordPress, Wix, Squarespace
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align:center;font-size:12px;color:#94a3b8;line-height:1.6">
    <p style="margin:0 0 4px">${provider.name}${provider.specialty ? ` — ${provider.specialty}` : ''}${provider.address_city ? ` — ${provider.address_city}` : ''}</p>
    <p style="margin:0 0 12px">Cet email vous a ete envoye car votre entreprise est referencee sur ServicesArtisans.fr</p>
    <p style="margin:0">
      <a href="${SITE_URL}" style="color:#3464f4;text-decoration:none">ServicesArtisans.fr</a>
    </p>
  </div>

</div>
</body>
</html>`

  const text = `Bonjour ${firstName},

Votre entreprise ${provider.name} est referencee sur ServicesArtisans.fr en tant que ${isVerified ? 'Artisan Verifie' : 'Artisan Reference'}${provider.address_city ? ` a ${provider.address_city}` : ''}.
${hasRating ? `Votre note actuelle : ${rating.toFixed(1)}/5 (${reviews} avis)\n` : ''}
Nous avons cree un badge gratuit que vous pouvez afficher sur votre site web pour renforcer votre credibilite aupres de vos clients.

Pourquoi afficher le badge ?
- Confiance client : 73% des internautes font plus confiance aux sites avec un badge
- Plus de demandes : +35% de contacts en moyenne
- SEO gratuit : le badge ameliore votre referencement Google
- Mise a jour auto : note et avis en temps reel

Obtenez votre badge gratuit : ${configUrl}

100% gratuit - Aucun abonnement - Compatible WordPress, Wix, Squarespace

---
Cet email vous a ete envoye car ${provider.name} est referencee sur ServicesArtisans.fr`

  return { subject, html, text }
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('=== Outreach Badge ServicesArtisans ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (pas d\'envoi)' : 'ENVOI REEL'}`)
  console.log(`Limite: ${LIMIT} | Verified only: ${VERIFIED_ONLY}`)
  console.log('')

  // Fetch providers with email
  let query = supabase
    .from('providers')
    .select('name, slug, stable_id, email, specialty, address_city, is_verified, rating_average, review_count')
    .eq('is_active', true)
    .not('email', 'is', null)
    .neq('email', '')
    .order('is_verified', { ascending: false })
    .order('review_count', { ascending: false, nullsFirst: false })
    .limit(LIMIT)

  if (VERIFIED_ONLY) {
    query = query.eq('is_verified', true)
  }

  const { data: providers, error } = await query

  if (error) {
    console.error('Erreur DB:', error.message)
    process.exit(1)
  }

  if (!providers || providers.length === 0) {
    console.log('Aucun artisan avec email trouve.')
    process.exit(0)
  }

  console.log(`${providers.length} artisans trouves avec email`)
  console.log(`  - Verifies: ${providers.filter(p => p.is_verified).length}`)
  console.log(`  - References: ${providers.filter(p => !p.is_verified).length}`)
  console.log('')

  let sent = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < providers.length; i += BATCH_SIZE) {
    const batch = providers.slice(i, i + BATCH_SIZE)

    for (const provider of batch) {
      if (!provider.email || !provider.email.includes('@')) {
        skipped++
        continue
      }

      const { subject, html, text } = buildBadgeEmail(provider)

      if (DRY_RUN) {
        console.log(`[DRY] ${provider.email} — ${subject}`)
        sent++
        continue
      }

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: provider.email,
          subject,
          html,
          text,
          tags: [
            { name: 'type', value: 'badge-outreach' },
            { name: 'provider_slug', value: provider.slug || '' },
          ],
        })
        console.log(`[OK]  ${provider.email} — ${provider.name}`)
        sent++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[ERR] ${provider.email} — ${msg}`)
        failed++
      }
    }

    // Rate limit pause between batches
    if (!DRY_RUN && i + BATCH_SIZE < providers.length) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log('')
  console.log('=== Resultats ===')
  console.log(`Envoyes: ${sent}`)
  console.log(`Echoues: ${failed}`)
  console.log(`Ignores: ${skipped}`)
  console.log(`Total:   ${providers.length}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})

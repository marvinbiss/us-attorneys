/**
 * Fonctions serveur pour requêter barometre_stats depuis Supabase
 * Utilisées dans les pages SSR/ISR — NE PAS importer dans des composants client
 */

import { createAdminClient } from '@/lib/supabase/admin'

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BarometreStatRow {
  id: number
  metier: string
  metier_slug: string
  ville: string | null
  ville_slug: string | null
  departement: string | null
  departement_code: string | null
  region: string | null
  region_slug: string | null
  nb_artisans: number
  note_moyenne: number | null
  nb_avis: number
  taux_verification: number
  variation_trimestre: number | null
  updated_at: string
}

export interface NationalStats {
  totalArtisans: number
  noteGlobale: number
  totalAvis: number
  tauxVerifGlobal: number
  nbMetiers: number
  nbVilles: number
}

// ---------------------------------------------------------------------------
// Requêtes
// ---------------------------------------------------------------------------

/** Stats nationales par métier (ville=null, dept=null, region=null) */
export async function getStatsByMetier(metierSlug: string): Promise<BarometreStatRow | null> {
  if (IS_BUILD) return null
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .eq('metier_slug', metierSlug)
      .is('ville', null)
      .is('departement', null)
      .is('region', null)
      .single()
    return data as BarometreStatRow | null
  } catch {
    return null
  }
}

/** Stats par métier dans une ville */
export async function getStatsByMetierVille(metierSlug: string, villeSlug: string): Promise<BarometreStatRow | null> {
  if (IS_BUILD) return null
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .eq('metier_slug', metierSlug)
      .eq('ville_slug', villeSlug)
      .single()
    return data as BarometreStatRow | null
  } catch {
    return null
  }
}

/** Tous les métiers dans une région */
export async function getStatsByRegion(regionSlug: string): Promise<BarometreStatRow[]> {
  if (IS_BUILD) return []
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .eq('region_slug', regionSlug)
      .is('ville', null)
      .is('departement', null)
      .order('nb_artisans', { ascending: false })
    return (data ?? []) as BarometreStatRow[]
  } catch {
    return []
  }
}

/** Tous les métiers dans un département */
export async function getStatsByDepartement(deptCode: string): Promise<BarometreStatRow[]> {
  if (IS_BUILD) return []
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .eq('departement_code', deptCode)
      .is('ville', null)
      .order('nb_artisans', { ascending: false })
    return (data ?? []) as BarometreStatRow[]
  } catch {
    return []
  }
}

/** Stats globales nationales (somme de tous les métiers niveau national) */
export async function getNationalStats(): Promise<NationalStats> {
  if (IS_BUILD) {
    return { totalArtisans: 940000, noteGlobale: 4.2, totalAvis: 0, tauxVerifGlobal: 0, nbMetiers: 0, nbVilles: 0 }
  }
  try {
    const supabase = createAdminClient()

    // Métiers au niveau national
    const { data: national } = await supabase
      .from('barometre_stats')
      .select('*')
      .is('ville', null)
      .is('departement', null)
      .is('region', null)

    const rows = (national ?? []) as BarometreStatRow[]

    const totalArtisans = rows.reduce((s, r) => s + r.nb_artisans, 0)
    const totalAvis = rows.reduce((s, r) => s + r.nb_avis, 0)
    const ratedRows = rows.filter((r) => r.note_moyenne !== null)
    const noteGlobale = ratedRows.length > 0
      ? Math.round((ratedRows.reduce((s, r) => s + (r.note_moyenne ?? 0) * r.nb_artisans, 0) / ratedRows.reduce((s, r) => s + r.nb_artisans, 0)) * 100) / 100
      : 4.2
    const tauxVerifGlobal = totalArtisans > 0
      ? Math.round((rows.reduce((s, r) => s + r.taux_verification * r.nb_artisans, 0) / totalArtisans) * 10000) / 10000
      : 0

    // Count distinct villes
    const { count: villeCount } = await supabase
      .from('barometre_stats')
      .select('*', { count: 'exact', head: true })
      .not('ville', 'is', null)

    return {
      totalArtisans,
      noteGlobale,
      totalAvis,
      tauxVerifGlobal,
      nbMetiers: rows.length,
      nbVilles: villeCount ?? 0,
    }
  } catch {
    return { totalArtisans: 940000, noteGlobale: 4.2, totalAvis: 0, tauxVerifGlobal: 0, nbMetiers: 0, nbVilles: 0 }
  }
}

/** Top N métiers par nb_artisans (niveau national) */
export async function getTopMetiers(limit = 10): Promise<BarometreStatRow[]> {
  if (IS_BUILD) return []
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .is('ville', null)
      .is('departement', null)
      .is('region', null)
      .order('nb_artisans', { ascending: false })
      .limit(limit)
    return (data ?? []) as BarometreStatRow[]
  } catch {
    return []
  }
}

/** Top N villes par nb_artisans (toutes spécialités confondues) */
export async function getTopVilles(limit = 10): Promise<{ ville: string; ville_slug: string; total: number }[]> {
  if (IS_BUILD) return []
  try {
    const supabase = createAdminClient()
    // On récupère les villes et on agrège côté client
    const { data } = await supabase
      .from('barometre_stats')
      .select('ville, ville_slug, nb_artisans')
      .not('ville', 'is', null)
      .order('nb_artisans', { ascending: false })
      .limit(5000)

    if (!data) return []

    // Agrège par ville
    const villeMap = new Map<string, { ville: string; ville_slug: string; total: number }>()
    for (const row of data) {
      if (!row.ville || !row.ville_slug) continue
      const existing = villeMap.get(row.ville_slug)
      if (existing) {
        existing.total += row.nb_artisans
      } else {
        villeMap.set(row.ville_slug, {
          ville: row.ville,
          ville_slug: row.ville_slug,
          total: row.nb_artisans,
        })
      }
    }

    return Array.from(villeMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
  } catch {
    return []
  }
}

/** Stats d'un métier dans les top 20 villes */
export async function getMetierTopVilles(
  metierSlug: string,
  villeNames: string[],
): Promise<BarometreStatRow[]> {
  if (IS_BUILD) return []
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .eq('metier_slug', metierSlug)
      .in('ville', villeNames)
      .order('nb_artisans', { ascending: false })
    return (data ?? []) as BarometreStatRow[]
  } catch {
    return []
  }
}

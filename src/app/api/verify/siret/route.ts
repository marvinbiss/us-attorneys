import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// GET query params schema
const siretQuerySchema = z.object({
  siret: z.string().min(1),
})

export const dynamic = 'force-dynamic'

interface SireneResponse {
  etablissement?: {
    siret: string
    uniteLegale: {
      denominationUniteLegale: string
      activitePrincipaleUniteLegale: string
      trancheEffectifsUniteLegale: string
      dateCreationUniteLegale: string
    }
    adresseEtablissement: {
      numeroVoieEtablissement: string
      typeVoieEtablissement: string
      libelleVoieEtablissement: string
      codePostalEtablissement: string
      libelleCommuneEtablissement: string
    }
    periodesEtablissement: Array<{
      etatAdministratifEtablissement: string
    }>
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const queryParams = {
    siret: searchParams.get('siret'),
  }
  const result = siretQuerySchema.safeParse(queryParams)
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 2001,
          message: 'Bar number is required'
        }
      },
      { status: 400 }
    )
  }
  const { siret } = result.data

  // Validate SIRET format (14 digits)
  const siretClean = siret.replace(/\s/g, '')
  if (!/^\d{14}$/.test(siretClean)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 2002,
          message: 'Bar number must contain 14 digits'
        }
      },
      { status: 400 }
    )
  }

  // Validate SIRET checksum (Luhn algorithm)
  if (!validateSiretChecksum(siretClean)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 2003,
          message: 'Bar number is invalid'
        }
      },
      { status: 400 }
    )
  }

  try {
    // Call INSEE SIRENE API
    const apiToken = process.env.INSEE_API_TOKEN

    if (!apiToken) {
      // Return mock data in development if no API token
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          data: {
            siret: siretClean,
            businessName: 'Entreprise Test',
            address: '1 Rue de la Paix',
            city: 'Paris',
            postalCode: '75001',
            activity: 'Services',
            isActive: true,
            createdAt: '2020-01-01',
          }
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 9001,
            message: 'Service de verification temporairement indisponible'
          }
        },
        { status: 503 }
      )
    }

    const response = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3/siret/${siretClean}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
        },
      }
    )

    if (response.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 2004,
            message: 'No record found with this bar number'
          }
        },
        { status: 404 }
      )
    }

    if (!response.ok) {
      throw new Error(`INSEE API error: ${response.status}`)
    }

    const data: SireneResponse = await response.json()
    const etablissement = data.etablissement

    if (!etablissement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 2004,
            message: 'No record found with this bar number'
          }
        },
        { status: 404 }
      )
    }

    const adresse = etablissement.adresseEtablissement
    const uniteLegale = etablissement.uniteLegale
    const isActive = etablissement.periodesEtablissement?.[0]?.etatAdministratifEtablissement === 'A'

    return NextResponse.json({
      success: true,
      data: {
        siret: etablissement.siret,
        businessName: uniteLegale.denominationUniteLegale,
        address: [
          adresse.numeroVoieEtablissement,
          adresse.typeVoieEtablissement,
          adresse.libelleVoieEtablissement,
        ].filter(Boolean).join(' '),
        city: adresse.libelleCommuneEtablissement,
        postalCode: adresse.codePostalEtablissement,
        activity: uniteLegale.activitePrincipaleUniteLegale,
        isActive,
        createdAt: uniteLegale.dateCreationUniteLegale,
      }
    })
  } catch (error) {
    logger.error('SIRET verification error', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 9002,
          message: 'Error verifying SIRET'
        }
      },
      { status: 500 }
    )
  }
}

function validateSiretChecksum(siret: string): boolean {
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i], 10)
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

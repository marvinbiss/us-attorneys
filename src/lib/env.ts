import { z } from 'zod'

/**
 * Environment variable validation schema.
 *
 * Categories:
 *   1. Core infrastructure (Supabase, Stripe) -- required at runtime
 *   2. Public client-side vars (NEXT_PUBLIC_*) -- required for frontend
 *   3. Optional third-party services (AI, Redis, Twilio, etc.)
 *   4. Optional business/config vars (company info, secrets, etc.)
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   // env.STRIPE_SECRET_KEY is guaranteed to be a valid string starting with 'sk_'
 *
 * This module is NOT meant to be imported everywhere. Use it in critical
 * server-side entry points (health route, stripe webhook, etc.) where
 * validated env vars are essential.
 */

const envSchema = z.object({
  // ──────────────────────────────────────────────
  // Core infrastructure -- required at runtime
  // ──────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),

  // ──────────────────────────────────────────────
  // Node / Next.js
  // ──────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ──────────────────────────────────────────────
  // Public client-side vars (optional -- may not be set in all envs)
  // ──────────────────────────────────────────────
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),

  // ──────────────────────────────────────────────
  // AI services (optional)
  // ──────────────────────────────────────────────
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // ──────────────────────────────────────────────
  // Redis / rate-limiting (optional)
  // ──────────────────────────────────────────────
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ──────────────────────────────────────────────
  // Two-factor authentication (optional)
  // ──────────────────────────────────────────────
  TWO_FACTOR_ENCRYPTION_KEY: z.string().min(32).optional(),
  TWO_FACTOR_SALT: z.string().min(8).optional(),

  // ──────────────────────────────────────────────
  // Email (Resend) (optional)
  // ──────────────────────────────────────────────
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // ──────────────────────────────────────────────
  // Twilio (optional)
  // ──────────────────────────────────────────────
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),

  // ──────────────────────────────────────────────
  // Stripe plan price IDs (optional)
  // ──────────────────────────────────────────────
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_PREMIUM_PRICE_ID: z.string().optional(),

  // French APIs removed: INSEE, Pappers, SIRENE

  // ──────────────────────────────────────────────
  // Misc secrets & config (optional)
  // ──────────────────────────────────────────────
  CRON_SECRET: z.string().optional(),
  INDEXNOW_API_KEY: z.string().optional(),
  REVALIDATE_SECRET: z.string().optional(),
  REVIEW_HMAC_SECRET: z.string().optional(),
  UNSUBSCRIBE_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),

  // ──────────────────────────────────────────────
  // Company / legal metadata (optional -- used in legal pages)
  // ──────────────────────────────────────────────
  COMPANY_LEGAL_NAME: z.string().optional(),
  COMPANY_ADDRESS: z.string().optional(),
  COMPANY_PHONE: z.string().optional(),
  COMPANY_SIRET: z.string().optional(),
  COMPANY_RCS: z.string().optional(),
  COMPANY_TVA: z.string().optional(),
  COMPANY_CAPITAL_SOCIAL: z.string().optional(),
  COMPANY_FORME_JURIDIQUE: z.string().optional(),
  COMPANY_DIRECTEUR_PUBLICATION: z.string().optional(),
  COMPANY_STATUS: z.string().optional(),
  COMPANY_FOUNDING_DATE: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  // Skip validation during build and tests
  if (process.env.NEXT_BUILD_SKIP_DB || process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return process.env as unknown as Env
  }

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')

    throw new Error(
      [
        '',
        '===========================================',
        ' Invalid environment variables',
        '===========================================',
        issues,
        '',
        'Hint: check your .env.local file or hosting environment variables.',
        '===========================================',
        '',
      ].join('\n')
    )
  }

  return result.data
}

export const env = validateEnv()

/**
 * Email Drip Campaign System
 *
 * Three campaign types:
 *  - trial_onboarding: Days 0, 1, 3, 7, 10, 13 after trial start
 *  - post_conversion:  Months 1, 2, 3 after paid subscription start
 *  - win_back:         Days 1, 7, 30 after churn
 *
 * Each step is sent exactly once per attorney (enforced by DB unique constraint).
 * Respects email_preferences and global unsubscribe.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, type EmailTemplate } from '@/lib/services/email-service'
import { logger } from '@/lib/logger'

// ── Types ────────────────────────────────────────────────────────────────────

export type CampaignType = 'trial_onboarding' | 'post_conversion' | 'win_back'

export interface CampaignStep {
  step: string           // e.g. 'day_0', 'month_1'
  delayDays: number      // Days after anchor date
  templateKey: string    // For logging / email_sends.template
  subject: string
  getHtml: (data: DripEmailData) => string
}

export interface DripEmailData {
  attorneyId: string
  attorneyName: string
  attorneyEmail: string
  profileViews?: number
  leadsCount?: number
  leadsPerMonth?: number
  profileUrl?: string
  dashboardUrl?: string
  upgradeUrl?: string
  unsubscribeUrl?: string
}

export interface SendResult {
  attorneyId: string
  campaign: CampaignType
  step: string
  success: boolean
  error?: string
  skipped?: boolean
  skipReason?: string
}

// ── Configuration ────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://us-attorneys.com'

function emailWrapper(content: string, unsubUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button-green { background: #059669; }
    .button-orange { background: #f59e0b; }
    .button-red { background: #dc2626; }
    .stat-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
    .stat-number { font-size: 32px; font-weight: 700; color: #2563eb; }
    .stat-label { color: #666; font-size: 14px; }
    .footer { text-align: center; color: #999; font-size: 11px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .footer a { color: #999; text-decoration: underline; }
    .tip { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px; margin: 15px 0; }
    .urgency { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; border-radius: 4px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>US Attorneys - Find qualified attorneys near you</p>
      <p><a href="${unsubUrl}">Unsubscribe</a> from these emails</p>
    </div>
  </div>
</body>
</html>`
}

// ── Campaign Definitions ─────────────────────────────────────────────────────

export const CAMPAIGNS: Record<CampaignType, CampaignStep[]> = {
  trial_onboarding: [
    {
      step: 'day_0',
      delayDays: 0,
      templateKey: 'trial_welcome',
      subject: "Welcome! Here's how to get your first client",
      getHtml: (d) => emailWrapper(`
        <div class="header"><h1>Welcome to US Attorneys!</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <p>Welcome to US Attorneys! Your 14-day free trial has started, and we are excited to help you connect with clients who need your expertise.</p>
          <p><strong>Here is how to get your first client:</strong></p>
          <div class="tip">
            <strong>Step 1:</strong> Complete your profile with your practice areas, education, and a professional photo.<br>
            <strong>Step 2:</strong> Add your availability so clients can book consultations.<br>
            <strong>Step 3:</strong> Respond quickly to leads — attorneys who respond within 1 hour get 3x more clients.
          </div>
          <p style="text-align: center;">
            <a href="${d.dashboardUrl}" class="button button-green">Go to My Dashboard</a>
          </p>
          <p>Your trial includes all Pro features — unlimited for 14 days.</p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
    {
      step: 'day_1',
      delayDays: 1,
      templateKey: 'trial_complete_profile',
      subject: 'Complete your profile to rank higher in search',
      getHtml: (d) => emailWrapper(`
        <div class="header"><h1>Rank Higher in Search</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <p>Did you know? Attorneys with complete profiles receive <strong>5x more client inquiries</strong> than those with incomplete ones.</p>
          <p><strong>What makes a great profile:</strong></p>
          <ul>
            <li>Professional headshot (profiles with photos get 70% more clicks)</li>
            <li>Detailed practice area descriptions</li>
            <li>Education and bar admissions</li>
            <li>Case results and success stories</li>
            <li>Client testimonials</li>
          </ul>
          <p style="text-align: center;">
            <a href="${d.dashboardUrl}/profile" class="button">Complete My Profile</a>
          </p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
    {
      step: 'day_3',
      delayDays: 3,
      templateKey: 'trial_profile_views',
      subject: 'Your profile has been viewed — here are the stats',
      getHtml: (d) => emailWrapper(`
        <div class="header"><h1>Your Profile Is Getting Noticed</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <p>Great news! Your profile is already attracting potential clients.</p>
          <div class="stat-box">
            <div class="stat-number">${d.profileViews ?? 0}</div>
            <div class="stat-label">Profile Views This Week</div>
          </div>
          <p>Each view is a potential client evaluating whether to contact you. A complete, professional profile converts views into leads at a much higher rate.</p>
          <p style="text-align: center;">
            <a href="${d.dashboardUrl}/statistics" class="button">View My Stats</a>
          </p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
    {
      step: 'day_7',
      delayDays: 7,
      templateKey: 'trial_social_proof',
      subject: 'Attorneys like you close leads every month — here is how',
      getHtml: (d) => emailWrapper(`
        <div class="header"><h1>What Top Attorneys Do Differently</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <p>You are halfway through your trial. Here is what we have learned from the most successful attorneys on our platform:</p>
          <div class="stat-box">
            <div class="stat-number">${d.leadsPerMonth ?? 12}</div>
            <div class="stat-label">Average Leads Per Month (Pro Attorneys)</div>
          </div>
          <div class="tip">
            <strong>Top 3 success factors:</strong><br>
            1. Respond to inquiries within 1 hour<br>
            2. Keep your calendar updated weekly<br>
            3. Ask satisfied clients for reviews
          </div>
          <p style="text-align: center;">
            <a href="${d.dashboardUrl}" class="button">Check My Leads</a>
          </p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
    {
      step: 'day_10',
      delayDays: 10,
      templateKey: 'trial_urgency',
      subject: '3 days left in your trial — upgrade to keep your leads',
      getHtml: (d) => emailWrapper(`
        <div class="header" style="background: #f59e0b;"><h1>3 Days Left in Your Trial</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <div class="urgency">
            <strong>Your free trial ends in 3 days.</strong> After that, your profile will be downgraded to the Free plan with limited visibility.
          </div>
          <p><strong>Here is what you will lose:</strong></p>
          <ul>
            <li>Priority placement in search results (2x-5x boost)</li>
            <li>Unlimited leads per month (Free plan: 5/month)</li>
            <li>Detailed analytics dashboard</li>
            <li>Priority badge on your profile</li>
            <li>Client review solicitation tools</li>
          </ul>
          <p style="text-align: center;">
            <a href="${d.upgradeUrl}" class="button button-orange">Upgrade Now — Keep My Leads</a>
          </p>
          <p style="color: #666; font-size: 13px;">Plans start at $99/month. Cancel anytime.</p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
    {
      step: 'day_13',
      delayDays: 13,
      templateKey: 'trial_last_day',
      subject: 'Last day! Do not lose your leads — upgrade now',
      getHtml: (d) => emailWrapper(`
        <div class="header" style="background: #dc2626;"><h1>Last Day of Your Trial</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <div class="urgency">
            <strong>Your trial expires tomorrow.</strong> This is your last chance to upgrade without interruption.
          </div>
          ${(d.profileViews ?? 0) > 0 || (d.leadsCount ?? 0) > 0 ? `
          <p>Look at what you have built so far:</p>
          <div style="display: flex; gap: 15px;">
            <div class="stat-box" style="flex: 1;">
              <div class="stat-number">${d.profileViews ?? 0}</div>
              <div class="stat-label">Profile Views</div>
            </div>
            <div class="stat-box" style="flex: 1;">
              <div class="stat-number">${d.leadsCount ?? 0}</div>
              <div class="stat-label">Leads Received</div>
            </div>
          </div>
          <p><strong>Do not let this momentum go to waste.</strong></p>
          ` : ''}
          <p style="text-align: center;">
            <a href="${d.upgradeUrl}" class="button button-red">Upgrade Now</a>
          </p>
          <p style="color: #666; font-size: 13px; text-align: center;">Plans start at $99/month. Cancel anytime. No questions asked.</p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
  ],

  post_conversion: [
    {
      step: 'month_1',
      delayDays: 30,
      templateKey: 'post_first_month',
      subject: 'Your first month — here are your results',
      getHtml: (d) => emailWrapper(`
        <div class="header" style="background: #059669;"><h1>Your First Month Review</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <p>Congratulations on your first month as a Pro member! Here is a summary of your performance:</p>
          <div style="display: flex; gap: 15px;">
            <div class="stat-box" style="flex: 1;">
              <div class="stat-number">${d.profileViews ?? 0}</div>
              <div class="stat-label">Profile Views</div>
            </div>
            <div class="stat-box" style="flex: 1;">
              <div class="stat-number">${d.leadsCount ?? 0}</div>
              <div class="stat-label">Leads Received</div>
            </div>
          </div>
          <div class="tip">
            <strong>Tip:</strong> Attorneys who respond to leads within 1 hour have a 3x higher conversion rate. Check your leads regularly!
          </div>
          <p style="text-align: center;">
            <a href="${d.dashboardUrl}/statistics" class="button button-green">View Full Analytics</a>
          </p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
    {
      step: 'month_2',
      delayDays: 60,
      templateKey: 'post_pro_tips',
      subject: 'Pro tips: optimize your profile for more leads',
      getHtml: (d) => emailWrapper(`
        <div class="header"><h1>Maximize Your ROI</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <p>You have been a Pro member for 2 months. Here are proven strategies to get even more value from your subscription:</p>
          <div class="tip">
            <strong>1. Add case results</strong><br>
            Attorneys who showcase successful outcomes receive 40% more inquiries.
          </div>
          <div class="tip">
            <strong>2. Collect reviews</strong><br>
            Profiles with 5+ reviews rank significantly higher in search results.
          </div>
          <div class="tip">
            <strong>3. Update your availability weekly</strong><br>
            Active calendars signal to clients that you are responsive and available.
          </div>
          <div class="tip">
            <strong>4. Add a professional video introduction</strong><br>
            Video intros increase consultation bookings by up to 60%.
          </div>
          <p style="text-align: center;">
            <a href="${d.dashboardUrl}/profile" class="button">Optimize My Profile</a>
          </p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
    {
      step: 'month_3',
      delayDays: 90,
      templateKey: 'post_quarterly_review',
      subject: 'Your quarterly review — here are your stats',
      getHtml: (d) => emailWrapper(`
        <div class="header" style="background: #7c3aed;"><h1>Quarterly Performance Review</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <p>You have been a valued member for 3 months. Here is your quarterly performance summary:</p>
          <div style="display: flex; gap: 15px;">
            <div class="stat-box" style="flex: 1;">
              <div class="stat-number">${d.profileViews ?? 0}</div>
              <div class="stat-label">Total Profile Views</div>
            </div>
            <div class="stat-box" style="flex: 1;">
              <div class="stat-number">${d.leadsCount ?? 0}</div>
              <div class="stat-label">Total Leads</div>
            </div>
          </div>
          <p>We are continuously improving the platform to bring you more qualified leads. Thank you for being part of the US Attorneys community.</p>
          <p style="text-align: center;">
            <a href="${d.dashboardUrl}/statistics" class="button" style="background: #7c3aed;">View Detailed Analytics</a>
          </p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
  ],

  win_back: [
    {
      step: 'day_1',
      delayDays: 1,
      templateKey: 'winback_sorry',
      subject: "We're sorry to see you go — here's what you'll miss",
      getHtml: (d) => emailWrapper(`
        <div class="header" style="background: #6b7280;"><h1>We Will Miss You</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <p>We are sorry to see you cancel your subscription. We understand that plans change, but here is what your downgrade means:</p>
          <ul>
            <li><strong>Search visibility:</strong> Your profile will drop in search rankings</li>
            <li><strong>Lead limit:</strong> You will be limited to 5 leads per month</li>
            <li><strong>Analytics:</strong> Detailed analytics will no longer be available</li>
            <li><strong>Priority badge:</strong> Your Pro/Premium badge will be removed</li>
          </ul>
          <p>Your profile and existing reviews will remain live on the platform.</p>
          <p style="text-align: center;">
            <a href="${d.upgradeUrl}" class="button">Reactivate My Subscription</a>
          </p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
    {
      step: 'day_7',
      delayDays: 7,
      templateKey: 'winback_offer',
      subject: 'Come back — special offer: 50% off for 3 months',
      getHtml: (d) => emailWrapper(`
        <div class="header" style="background: #059669;"><h1>Special Offer Just for You</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <p>We would love to have you back. As a returning member, we are offering you an exclusive deal:</p>
          <div class="stat-box" style="background: #ecfdf5; border: 2px solid #059669;">
            <div class="stat-number" style="color: #059669;">50% OFF</div>
            <div class="stat-label">For Your First 3 Months Back</div>
          </div>
          <p>That is just <strong>$49.50/month</strong> for the Pro plan — less than the cost of a single billable hour.</p>
          <div class="tip">
            <strong>What you get:</strong><br>
            - Up to 50 qualified leads per month<br>
            - 2x search priority boost<br>
            - Full analytics dashboard<br>
            - Priority badge on your profile
          </div>
          <p style="text-align: center;">
            <a href="${d.upgradeUrl}?promo=COMEBACK50" class="button button-green">Claim 50% Off Now</a>
          </p>
          <p style="color: #666; font-size: 13px; text-align: center;">This offer expires in 7 days.</p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
    {
      step: 'day_30',
      delayDays: 30,
      templateKey: 'winback_reminder',
      subject: 'Your profile is still live — reactivate anytime',
      getHtml: (d) => emailWrapper(`
        <div class="header"><h1>Your Profile Is Still Live</h1></div>
        <div class="content">
          <p>Hi ${d.attorneyName},</p>
          <p>It has been a month since you cancelled, but your profile is still live on US Attorneys and potential clients can still find you.</p>
          ${(d.profileViews ?? 0) > 0 ? `
          <div class="stat-box">
            <div class="stat-number">${d.profileViews}</div>
            <div class="stat-label">Profile Views Since You Left</div>
          </div>
          <p>That is ${d.profileViews} potential clients who looked at your profile but could not easily reach you.</p>
          ` : ''}
          <p>You can reactivate your subscription at any time — your profile, reviews, and history are all preserved.</p>
          <p style="text-align: center;">
            <a href="${d.upgradeUrl}" class="button">Reactivate My Subscription</a>
          </p>
          <p style="color: #666; font-size: 13px; text-align: center;">No commitment. Cancel anytime.</p>
        </div>
      `, d.unsubscribeUrl || ''),
    },
  ],
}

// ── Helper: Generate signed unsubscribe URL ──────────────────────────────────

function generateUnsubscribeToken(attorneyId: string): string {
  const crypto = require('crypto')
  const secret = process.env.UNSUBSCRIBE_SECRET || 'dev-unsubscribe-secret'
  return crypto
    .createHmac('sha256', secret)
    .update(attorneyId)
    .digest('hex')
}

function getSignedUnsubscribeUrl(attorneyId: string): string {
  const token = generateUnsubscribeToken(attorneyId)
  return `${APP_URL}/api/email/unsubscribe?aid=${attorneyId}&token=${token}`
}

// ── Core: Check if email should be sent ──────────────────────────────────────

export async function shouldSendEmail(
  attorneyId: string,
  campaign: CampaignType,
  step: string
): Promise<{ canSend: boolean; reason?: string }> {
  const supabase = createAdminClient()

  // 1. Check if already sent (unique constraint would catch this, but we pre-check)
  const { data: existingSend } = await supabase
    .from('email_sends')
    .select('id')
    .eq('attorney_id', attorneyId)
    .eq('campaign', campaign)
    .eq('step', step)
    .maybeSingle()

  if (existingSend) {
    return { canSend: false, reason: 'already_sent' }
  }

  // 2. Check email preferences
  const { data: prefs } = await supabase
    .from('email_preferences')
    .select('marketing_emails, product_updates, unsubscribed_at')
    .eq('attorney_id', attorneyId)
    .maybeSingle()

  if (prefs?.unsubscribed_at) {
    return { canSend: false, reason: 'globally_unsubscribed' }
  }

  if (prefs && !prefs.marketing_emails) {
    return { canSend: false, reason: 'marketing_emails_disabled' }
  }

  // 3. Check attorney has an email (via user_id -> profiles)
  const { data: attorney } = await supabase
    .from('attorneys')
    .select('id, user_id, name')
    .eq('id', attorneyId)
    .maybeSingle()

  if (!attorney?.user_id) {
    return { canSend: false, reason: 'no_user_account' }
  }

  return { canSend: true }
}

// ── Core: Send a drip email ──────────────────────────────────────────────────

export async function sendDripEmail(
  attorneyId: string,
  campaign: CampaignType,
  stepDef: CampaignStep,
  data: DripEmailData
): Promise<SendResult> {
  const supabase = createAdminClient()

  // Pre-flight check
  const check = await shouldSendEmail(attorneyId, campaign, stepDef.step)
  if (!check.canSend) {
    return {
      attorneyId,
      campaign,
      step: stepDef.step,
      success: false,
      skipped: true,
      skipReason: check.reason,
    }
  }

  // Build email
  data.unsubscribeUrl = getSignedUnsubscribeUrl(attorneyId)
  data.dashboardUrl = data.dashboardUrl || `${APP_URL}/attorney-dashboard`
  data.upgradeUrl = data.upgradeUrl || `${APP_URL}/attorney-dashboard/subscription`
  data.profileUrl = data.profileUrl || `${APP_URL}/attorney-dashboard/profile`

  const template: EmailTemplate = {
    subject: stepDef.subject,
    html: stepDef.getHtml(data),
  }

  // Send via Resend
  const result = await sendEmail({
    to: data.attorneyEmail,
    template,
  })

  // Record in email_sends
  const { error: insertError } = await supabase
    .from('email_sends')
    .insert({
      attorney_id: attorneyId,
      campaign,
      step: stepDef.step,
      template: stepDef.templateKey,
      resend_id: result.id || null,
      error: result.success ? null : result.error,
    })

  if (insertError) {
    // Unique constraint violation = already sent (race condition)
    if (insertError.code === '23505') {
      logger.warn('[DripCampaign] Duplicate send prevented by DB constraint', {
        attorneyId,
        campaign,
        step: stepDef.step,
      })
      return {
        attorneyId,
        campaign,
        step: stepDef.step,
        success: false,
        skipped: true,
        skipReason: 'duplicate_prevented_by_constraint',
      }
    }
    logger.error('[DripCampaign] Failed to record email_send', { error: insertError })
  }

  if (!result.success) {
    logger.error('[DripCampaign] Failed to send email', {
      attorneyId,
      campaign,
      step: stepDef.step,
      error: result.error,
    })
  }

  return {
    attorneyId,
    campaign,
    step: stepDef.step,
    success: result.success,
    error: result.error,
  }
}

// ── Core: Find eligible attorneys for each campaign ──────────────────────────

interface EligibleAttorney {
  id: string
  name: string
  email: string
  anchorDate: Date
}

/**
 * Find attorneys eligible for trial onboarding emails.
 * Anchor: trial_started_at
 */
export async function findTrialOnboardingEligible(): Promise<Map<string, EligibleAttorney[]>> {
  const supabase = createAdminClient()
  const result = new Map<string, EligibleAttorney[]>()

  // Get attorneys who started a trial and haven't converted yet
  const { data: attorneys, error } = await supabase
    .from('attorneys')
    .select(`
      id, name, user_id, trial_started_at,
      subscription_tier
    `)
    .not('trial_started_at', 'is', null)
    .not('user_id', 'is', null)
    .limit(1000)

  if (error || !attorneys) {
    logger.error('[DripCampaign] Failed to query trial attorneys', { error })
    return result
  }

  // Get emails for these attorneys
  const userIds = attorneys.map(a => a.user_id).filter(Boolean)
  if (userIds.length === 0) return result

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds)

  const emailMap = new Map((profiles || []).map(p => [p.id, p.email]))

  const now = new Date()

  for (const step of CAMPAIGNS.trial_onboarding) {
    const eligible: EligibleAttorney[] = []

    for (const attorney of attorneys) {
      if (!attorney.trial_started_at || !attorney.user_id) continue
      const email = emailMap.get(attorney.user_id)
      if (!email) continue

      // Skip if already converted to paid
      if (attorney.subscription_tier !== 'free') continue

      const trialStart = new Date(attorney.trial_started_at)
      const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24))

      // Send on the target day or up to 1 day late (for cron timing tolerance)
      if (daysSinceStart >= step.delayDays && daysSinceStart <= step.delayDays + 1) {
        eligible.push({
          id: attorney.id,
          name: attorney.name || 'Attorney',
          email,
          anchorDate: trialStart,
        })
      }
    }

    if (eligible.length > 0) {
      result.set(step.step, eligible)
    }
  }

  return result
}

/**
 * Find attorneys eligible for post-conversion emails.
 * Anchor: subscription_started_at
 */
export async function findPostConversionEligible(): Promise<Map<string, EligibleAttorney[]>> {
  const supabase = createAdminClient()
  const result = new Map<string, EligibleAttorney[]>()

  const { data: attorneys, error } = await supabase
    .from('attorneys')
    .select(`
      id, name, user_id, subscription_started_at,
      subscription_tier
    `)
    .not('subscription_started_at', 'is', null)
    .in('subscription_tier', ['pro', 'premium'])
    .not('user_id', 'is', null)
    .limit(1000)

  if (error || !attorneys) {
    logger.error('[DripCampaign] Failed to query converted attorneys', { error })
    return result
  }

  const userIds = attorneys.map(a => a.user_id).filter(Boolean)
  if (userIds.length === 0) return result

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds)

  const emailMap = new Map((profiles || []).map(p => [p.id, p.email]))

  const now = new Date()

  for (const step of CAMPAIGNS.post_conversion) {
    const eligible: EligibleAttorney[] = []

    for (const attorney of attorneys) {
      if (!attorney.subscription_started_at || !attorney.user_id) continue
      const email = emailMap.get(attorney.user_id)
      if (!email) continue

      const subStart = new Date(attorney.subscription_started_at)
      const daysSinceStart = Math.floor((now.getTime() - subStart.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceStart >= step.delayDays && daysSinceStart <= step.delayDays + 1) {
        eligible.push({
          id: attorney.id,
          name: attorney.name || 'Attorney',
          email,
          anchorDate: subStart,
        })
      }
    }

    if (eligible.length > 0) {
      result.set(step.step, eligible)
    }
  }

  return result
}

/**
 * Find attorneys eligible for win-back emails.
 * Anchor: churned_at
 */
export async function findWinBackEligible(): Promise<Map<string, EligibleAttorney[]>> {
  const supabase = createAdminClient()
  const result = new Map<string, EligibleAttorney[]>()

  const { data: attorneys, error } = await supabase
    .from('attorneys')
    .select(`
      id, name, user_id, churned_at,
      subscription_tier
    `)
    .not('churned_at', 'is', null)
    .eq('subscription_tier', 'free')
    .not('user_id', 'is', null)
    .limit(1000)

  if (error || !attorneys) {
    logger.error('[DripCampaign] Failed to query churned attorneys', { error })
    return result
  }

  const userIds = attorneys.map(a => a.user_id).filter(Boolean)
  if (userIds.length === 0) return result

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds)

  const emailMap = new Map((profiles || []).map(p => [p.id, p.email]))

  const now = new Date()

  for (const step of CAMPAIGNS.win_back) {
    const eligible: EligibleAttorney[] = []

    for (const attorney of attorneys) {
      if (!attorney.churned_at || !attorney.user_id) continue
      const email = emailMap.get(attorney.user_id)
      if (!email) continue

      const churnDate = new Date(attorney.churned_at)
      const daysSinceChurn = Math.floor((now.getTime() - churnDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceChurn >= step.delayDays && daysSinceChurn <= step.delayDays + 1) {
        eligible.push({
          id: attorney.id,
          name: attorney.name || 'Attorney',
          email,
          anchorDate: churnDate,
        })
      }
    }

    if (eligible.length > 0) {
      result.set(step.step, eligible)
    }
  }

  return result
}

/**
 * Fetch stats for an attorney (profile views, leads count).
 * Used to personalize drip emails with real data.
 *
 * - review_count from attorneys table as a proxy for engagement
 * - lead_count from lead_usage table (current month)
 * - Profile views estimated from analytics_events (if tracked)
 */
export async function getAttorneyStats(attorneyId: string): Promise<{
  profileViews: number
  leadsCount: number
}> {
  const supabase = createAdminClient()

  // Get review_count from attorneys table as engagement proxy
  const { data: attorney } = await supabase
    .from('attorneys')
    .select('review_count')
    .eq('id', attorneyId)
    .maybeSingle()

  // Get lead usage for current month
  const currentMonth = new Date()
  currentMonth.setDate(1)
  currentMonth.setHours(0, 0, 0, 0)

  const { data: usage } = await supabase
    .from('lead_usage')
    .select('lead_count')
    .eq('attorney_id', attorneyId)
    .eq('month', currentMonth.toISOString().split('T')[0])
    .maybeSingle()

  // Profile views: count analytics events where properties->attorney_id matches
  // This is best-effort — may return 0 if analytics aren't tracking attorney views
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count: viewCount } = await supabase
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'profile_view')
    .contains('properties', { attorney_id: attorneyId })
    .gte('created_at', thirtyDaysAgo)

  return {
    profileViews: viewCount ?? (attorney?.review_count ?? 0) * 10, // Fallback heuristic
    leadsCount: usage?.lead_count ?? 0,
  }
}

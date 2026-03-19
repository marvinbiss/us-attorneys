/**
 * Cron: Deadline Reminders — US Attorneys
 *
 * Runs daily. Checks deadline_reminders for upcoming deadlines and sends
 * push + email notifications at 30, 7, and 1 day before the deadline.
 *
 * Protected by CRON_SECRET Bearer token.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push/send'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ReminderRow {
  id: string
  user_id: string
  specialty_slug: string
  state_code: string
  deadline_date: string
  reminded_30d: boolean
  reminded_7d: boolean
  reminded_1d: boolean
}

export async function GET(request: NextRequest) {
  // Auth
  const authHeader = request.headers.get('authorization')
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const stats = { checked: 0, sent30d: 0, sent7d: 0, sent1d: 0, errors: 0 }

  try {
    // Fetch all non-expired reminders that still have pending notifications
    const { data: reminders, error } = await supabase
      .from('deadline_reminders')
      .select('id, user_id, specialty_slug, state_code, deadline_date, reminded_30d, reminded_7d, reminded_1d')
      .gte('deadline_date', now.toISOString().split('T')[0])
      .or('reminded_30d.eq.false,reminded_7d.eq.false,reminded_1d.eq.false')
      .limit(500)

    if (error) {
      logger.error('Failed to fetch deadline reminders', { error: error.message })
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ message: 'No pending reminders', stats })
    }

    stats.checked = reminders.length

    for (const reminder of reminders as ReminderRow[]) {
      const deadlineDate = new Date(reminder.deadline_date)
      const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      try {
        // 30-day reminder
        if (!reminder.reminded_30d && daysUntil <= 30) {
          await sendDeadlineNotification(supabase, reminder, '30 days')
          await supabase
            .from('deadline_reminders')
            .update({ reminded_30d: true, updated_at: new Date().toISOString() })
            .eq('id', reminder.id)
          stats.sent30d++
        }

        // 7-day reminder
        if (!reminder.reminded_7d && daysUntil <= 7) {
          await sendDeadlineNotification(supabase, reminder, '7 days')
          await supabase
            .from('deadline_reminders')
            .update({ reminded_7d: true, updated_at: new Date().toISOString() })
            .eq('id', reminder.id)
          stats.sent7d++
        }

        // 1-day reminder
        if (!reminder.reminded_1d && daysUntil <= 1) {
          await sendDeadlineNotification(supabase, reminder, '1 day')
          await supabase
            .from('deadline_reminders')
            .update({ reminded_1d: true, updated_at: new Date().toISOString() })
            .eq('id', reminder.id)
          stats.sent1d++
        }
      } catch (err) {
        stats.errors++
        logger.error('Failed to process deadline reminder', {
          reminderId: reminder.id,
          error: err instanceof Error ? err.message : 'Unknown',
        })
      }
    }

    logger.info('Deadline reminders cron completed', stats)
    return NextResponse.json({ message: 'Deadline reminders processed', stats })
  } catch (error) {
    logger.error('Deadline reminders cron fatal error', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendDeadlineNotification(supabase: any, reminder: ReminderRow, timeframe: string) {
  const title = `Legal Deadline in ${timeframe}`
  const body = `Your ${formatSlug(reminder.specialty_slug)} deadline in ${reminder.state_code} is in ${timeframe}. Don't wait — consult an attorney today.`
  const url = `/tools/deadline-tracker?specialty=${reminder.specialty_slug}&state=${reminder.state_code}`

  try {
    await sendPushToUser(reminder.user_id, { title, body, url })
  } catch {
    // Push may fail if user hasn't enabled — that's OK
    logger.warn('Push notification failed for deadline reminder', {
      userId: reminder.user_id,
      reminderId: reminder.id,
    })
  }

  // Also try email via profiles table
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', reminder.user_id)
      .single()

    if (profile?.email) {
      // Use Resend for email — import dynamically to avoid cold start penalty
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'US Attorneys <noreply@lawtendr.com>',
        to: profile.email,
        subject: title,
        html: `
          <h2>${title}</h2>
          <p>Hi${profile.full_name ? ` ${profile.full_name}` : ''},</p>
          <p>${body}</p>
          <p><a href="https://lawtendr.com${url}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Check Your Deadline</a></p>
          <p style="color:#666;font-size:12px;margin-top:24px;">This is an automated reminder from US Attorneys. You can manage your reminders in your account settings.</p>
        `,
      })
    }
  } catch (emailErr) {
    logger.warn('Email notification failed for deadline reminder', {
      userId: reminder.user_id,
      error: emailErr instanceof Error ? emailErr.message : 'Unknown',
    })
  }
}

function formatSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

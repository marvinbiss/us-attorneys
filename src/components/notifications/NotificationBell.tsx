/**
 * NotificationBell — Legacy wrapper.
 *
 * The unified NotificationCenter component (./NotificationCenter.tsx) is now
 * the canonical bell + dropdown used in the Header. This file provides a thin
 * wrapper for backward compatibility with dashboards that pass a userId prop.
 */

'use client'

import NotificationCenter from './NotificationCenter'

interface NotificationBellProps {
  /** @deprecated NotificationCenter reads the user from useAuth() internally. */
  userId?: string
}

export function NotificationBell(_props: NotificationBellProps) {
  return <NotificationCenter />
}

export default NotificationBell

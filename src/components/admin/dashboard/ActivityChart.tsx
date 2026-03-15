'use client'

import { type ReactNode, useState, useEffect, memo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ChartDataPoint {
  date: string
  bookings: number
  users: number
  reviews: number
}

interface ActivityChartProps {
  data: ChartDataPoint[]
  loading?: boolean
}

function formatDateTick(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="w-48 h-5 bg-gray-200 rounded mb-6" />
      <div className="w-full h-[300px] bg-gray-50 rounded flex items-end gap-1 px-8 pb-6">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 rounded-t"
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export const ActivityChart = memo(function ActivityChart({ data, loading }: ActivityChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (loading || !mounted) {
    return <ChartSkeleton />
  }

  const hasData = data.some((d) => d.bookings > 0 || d.users > 0 || d.reviews > 0)

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" role="region" aria-label="Activity chart for the last 30 days">
      <h3 className="font-semibold text-gray-900 mb-6">Activity over the last 30 days</h3>
      {!hasData ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400">
          <p>No data for this period</p>
        </div>
      ) : (
        <>
        <div className="sr-only">
          <p>Chart showing bookings, sign-ups, and reviews over the last 30 days.</p>
          <table>
            <thead><tr><th>Date</th><th>Bookings</th><th>Sign-ups</th><th>Reviews</th></tr></thead>
            <tbody>
              {data.filter(d => d.bookings > 0 || d.users > 0 || d.reviews > 0).map(d => (
                <tr key={d.date}>
                  <td>{formatDateTick(d.date)}</td>
                  <td>{d.bookings}</td>
                  <td>{d.users}</td>
                  <td>{d.reviews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillReviews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              labelFormatter={(label: ReactNode) => formatDateTick(String(label ?? ''))}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)',
                fontSize: '13px',
              }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="bookings"
              name="Bookings"
              stroke="#3b82f6"
              fill="url(#fillBookings)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="users"
              name="Sign-ups"
              stroke="#10b981"
              fill="url(#fillUsers)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="reviews"
              name="Reviews"
              stroke="#f59e0b"
              fill="url(#fillReviews)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        </>
      )}
    </div>
  )
})

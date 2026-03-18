'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  Download,
  ChevronUp,
  ChevronDown,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string
  number: string | null
  amount: number
  currency: string
  status: string | null
  pdfUrl: string | null
  description: string | null
  created: string
}

type SortField = 'created' | 'amount' | 'status'
type SortDir = 'asc' | 'desc'

interface InvoiceTableProps {
  invoices: Invoice[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInvoiceStatusConfig(status: string | null) {
  const map: Record<string, { label: string; icon: typeof CheckCircle; classes: string }> = {
    paid: {
      label: 'Paid',
      icon: CheckCircle,
      classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    open: {
      label: 'Pending',
      icon: Clock,
      classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    draft: {
      label: 'Draft',
      icon: Clock,
      classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    },
    uncollectible: {
      label: 'Failed',
      icon: AlertTriangle,
      classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    void: {
      label: 'Void',
      icon: AlertTriangle,
      classes: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
    },
  }
  return map[status ?? ''] || {
    label: status || 'Unknown',
    icon: Clock,
    classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Sort Header ─────────────────────────────────────────────────────────────

function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentDir: SortDir
  onSort: (field: SortField) => void
}) {
  const isActive = currentSort === field
  return (
    <button
      onClick={() => onSort(field)}
      className="group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
      aria-sort={isActive ? (currentDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      <span className="flex flex-col" aria-hidden="true">
        <ChevronUp
          className={`w-3 h-3 -mb-1 ${isActive && currentDir === 'asc' ? 'text-blue-600' : 'text-gray-300 dark:text-gray-600'}`}
        />
        <ChevronDown
          className={`w-3 h-3 ${isActive && currentDir === 'desc' ? 'text-blue-600' : 'text-gray-300 dark:text-gray-600'}`}
        />
      </span>
    </button>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  const reducedMotion = useReducedMotion()
  const [sortField, setSortField] = useState<SortField>('created')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortField) {
        case 'created':
          return (new Date(a.created).getTime() - new Date(b.created).getTime()) * dir
        case 'amount':
          return (a.amount - b.amount) * dir
        case 'status':
          return (a.status ?? '').localeCompare(b.status ?? '') * dir
        default:
          return 0
      }
    })
  }, [invoices, sortField, sortDir])

  if (invoices.length === 0) {
    return (
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.4 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8"
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl mb-3">
            <Receipt className="w-6 h-6 text-gray-400" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            No invoices yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Invoices will appear here once you subscribe to a paid plan.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Invoice History
        </h3>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th scope="col" className="px-6 py-3 text-left">
                <SortHeader label="Date" field="created" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Description
                </span>
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                <SortHeader label="Amount" field="amount" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                <SortHeader label="Status" field="status" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedInvoices.map((invoice) => {
              const statusConfig = getInvoiceStatusConfig(invoice.status)
              const Icon = statusConfig.icon
              return (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {formatDate(invoice.created)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {invoice.number || 'Invoice'}
                        </p>
                        {invoice.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {invoice.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right tabular-nums whitespace-nowrap">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.classes}`}
                      role="status"
                    >
                      <Icon className="w-3 h-3" aria-hidden="true" />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label={`Download invoice ${invoice.number || invoice.id}`}
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        PDF
                      </a>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {sortedInvoices.map((invoice) => {
          const statusConfig = getInvoiceStatusConfig(invoice.status)
          const Icon = statusConfig.icon
          return (
            <div key={invoice.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {invoice.number || 'Invoice'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.created)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </span>
              </div>
              {invoice.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {invoice.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.classes}`}
                  role="status"
                >
                  <Icon className="w-3 h-3" aria-hidden="true" />
                  {statusConfig.label}
                </span>
                {invoice.pdfUrl && (
                  <a
                    href={invoice.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={`Download invoice ${invoice.number || invoice.id}`}
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    PDF
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

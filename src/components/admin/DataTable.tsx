'use client'

import { ReactNode } from 'react'
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  width?: string
  render?: (item: T) => ReactNode
  /** Accessible label for screen readers when header is ambiguous */
  ariaLabel?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: ReactNode
  sortKey?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onRowClick?: (item: T) => void
  rowKey: (item: T) => string
  /** Accessible label for the table (e.g., "Attorneys list") */
  ariaLabel?: string
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data',
  emptyIcon,
  sortKey,
  sortOrder,
  onSort,
  onRowClick,
  rowKey,
  ariaLabel,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="p-8 text-center" role="status" aria-busy="true">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <span className="sr-only">Loading data...</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]" aria-label={ariaLabel}>
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                style={{ width: column.width }}
                onClick={() => column.sortable && onSort?.(column.key)}
                aria-sort={column.sortable && sortKey === column.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && sortKey === column.key && (
                    sortOrder === 'asc'
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => (
            <tr
              key={rowKey(item)}
              className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4">
                  {column.render
                    ? column.render(item)
                    : String((item as Record<string, unknown>)[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

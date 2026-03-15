'use client'

import { Check, X, Shield, Users, Briefcase, Star, CreditCard, Grid, Settings, FileText } from 'lucide-react'
import type { AdminPermissions, AdminRole } from '@/types/admin'

interface RolePermissionsEditorProps {
  role: AdminRole
  permissions: AdminPermissions
  onChange: (permissions: AdminPermissions) => void
  disabled?: boolean
}

const PERMISSION_GROUPS = [
  {
    key: 'users',
    label: 'Users',
    icon: Users,
    permissions: [
      { key: 'read', label: 'View' },
      { key: 'write', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'providers',
    label: 'Attorneys',
    icon: Briefcase,
    permissions: [
      { key: 'read', label: 'View' },
      { key: 'write', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
      { key: 'verify', label: 'Verify' },
    ],
  },
  {
    key: 'reviews',
    label: 'Reviews',
    icon: Star,
    permissions: [
      { key: 'read', label: 'View' },
      { key: 'write', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: CreditCard,
    permissions: [
      { key: 'read', label: 'View' },
      { key: 'refund', label: 'Refund' },
      { key: 'cancel', label: 'Cancel' },
    ],
  },
  {
    key: 'services',
    label: 'Services',
    icon: Grid,
    permissions: [
      { key: 'read', label: 'View' },
      { key: 'write', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    permissions: [
      { key: 'read', label: 'View' },
      { key: 'write', label: 'Edit' },
    ],
  },
  {
    key: 'audit',
    label: 'Audit',
    icon: FileText,
    permissions: [
      { key: 'read', label: 'View' },
    ],
  },
]

export function RolePermissionsEditor({
  role,
  permissions,
  onChange,
  disabled = false,
}: RolePermissionsEditorProps) {
  const togglePermission = (groupKey: string, permKey: string) => {
    if (disabled) return

    const group = permissions[groupKey as keyof AdminPermissions] as Record<string, boolean>
    const newPermissions = {
      ...permissions,
      [groupKey]: {
        ...group,
        [permKey]: !group[permKey],
      },
    }
    onChange(newPermissions)
  }

  const toggleGroupAll = (groupKey: string, enabled: boolean) => {
    if (disabled) return

    const group = PERMISSION_GROUPS.find(g => g.key === groupKey)
    if (!group) return

    const newGroupPerms: Record<string, boolean> = {}
    group.permissions.forEach(p => {
      newGroupPerms[p.key] = enabled
    })

    onChange({
      ...permissions,
      [groupKey]: newGroupPerms,
    })
  }

  const isGroupFullyEnabled = (groupKey: string) => {
    const group = permissions[groupKey as keyof AdminPermissions] as Record<string, boolean>
    return Object.values(group).every(v => v === true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-gray-400" />
        <h3 className="font-medium text-gray-900">Permissions for {role}</h3>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Resource
              </th>
              {['View', 'Edit', 'Delete', 'Other'].map(header => (
                <th key={header} className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PERMISSION_GROUPS.map((group) => {
              const Icon = group.icon
              const groupPerms = permissions[group.key as keyof AdminPermissions] as Record<string, boolean>

              return (
                <tr key={group.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-700">{group.label}</span>
                      <button
                        onClick={() => toggleGroupAll(group.key, !isGroupFullyEnabled(group.key))}
                        disabled={disabled}
                        className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          disabled
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {isGroupFullyEnabled(group.key) ? 'Disable all' : 'Enable all'}
                      </button>
                    </div>
                  </td>
                  {/* Read */}
                  <td className="px-2 py-3 text-center">
                    {'read' in groupPerms && (
                      <PermissionToggle
                        enabled={groupPerms.read}
                        onClick={() => togglePermission(group.key, 'read')}
                        disabled={disabled}
                      />
                    )}
                  </td>
                  {/* Write */}
                  <td className="px-2 py-3 text-center">
                    {'write' in groupPerms && (
                      <PermissionToggle
                        enabled={groupPerms.write}
                        onClick={() => togglePermission(group.key, 'write')}
                        disabled={disabled}
                      />
                    )}
                  </td>
                  {/* Delete */}
                  <td className="px-2 py-3 text-center">
                    {'delete' in groupPerms && (
                      <PermissionToggle
                        enabled={groupPerms.delete}
                        onClick={() => togglePermission(group.key, 'delete')}
                        disabled={disabled}
                      />
                    )}
                  </td>
                  {/* Other permissions */}
                  <td className="px-2 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {group.permissions
                        .filter(p => !['read', 'write', 'delete'].includes(p.key))
                        .map(p => (
                          <div key={p.key} className="flex items-center gap-1">
                            <PermissionToggle
                              enabled={groupPerms[p.key]}
                              onClick={() => togglePermission(group.key, p.key)}
                              disabled={disabled}
                            />
                            <span className="text-xs text-gray-500">{p.label}</span>
                          </div>
                        ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

function PermissionToggle({
  enabled,
  onClick,
  disabled,
}: {
  enabled: boolean
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer'
      } ${
        enabled
          ? 'bg-green-100 text-green-600 hover:bg-green-200'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      }`}
    >
      {enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    </button>
  )
}

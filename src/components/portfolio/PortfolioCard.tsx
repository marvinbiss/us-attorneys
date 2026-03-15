'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Play,
  Star,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  Layers,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { PortfolioItem } from '@/types/portfolio'

export interface PortfolioCardProps {
  item: PortfolioItem
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onToggleVisibility?: () => void
  onToggleFeatured?: () => void
  showActions?: boolean
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export default function PortfolioCard({
  item,
  onClick,
  onEdit,
  onDelete,
  onToggleVisibility,
  onToggleFeatured,
  showActions = false,
  isDragging = false,
  dragHandleProps,
}: PortfolioCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [imageError, setImageError] = useState(false)

  const thumbnailUrl =
    item.media_type === 'before_after'
      ? item.after_image_url || item.image_url
      : item.thumbnail_url || item.image_url

  return (
    <div
      className={clsx(
        'group relative bg-white rounded-2xl overflow-hidden border border-gray-200',
        'transition-all duration-300',
        isDragging && 'shadow-2xl scale-105 rotate-2',
        onClick && 'cursor-pointer hover:shadow-lg hover:-translate-y-1'
      )}
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] bg-gray-100" onClick={onClick}>
        {thumbnailUrl && !imageError ? (
          <Image
            src={thumbnailUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <Layers className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Video indicator */}
        {item.media_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Before/After indicator */}
        {item.media_type === 'before_after' && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 text-white text-xs font-medium rounded-lg flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Avant/Après
          </div>
        )}

        {/* Featured badge */}
        {item.is_featured && (
          <div className="absolute top-3 right-3 p-1.5 bg-amber-500 rounded-lg">
            <Star className="w-4 h-4 text-white" fill="currentColor" />
          </div>
        )}

        {/* Hidden indicator */}
        {!item.is_visible && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 rounded-lg">
              <EyeOff className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-medium">Masqué</span>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        {onClick && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="flex-shrink-0 p-1 -ml-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-5 h-5" />
            </div>
          )}

          {/* Title and category */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
            {item.category && (
              <p className="text-sm text-gray-500 mt-0.5 capitalize">{item.category}</p>
            )}
          </div>

          {/* Actions menu */}
          {showActions && (
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                aria-label="Actions"
                aria-expanded={showMenu}
                title="Actions"
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          onEdit()
                        }}
                        aria-label="Modifier"
                        title="Modifier"
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </button>
                    )}
                    {onToggleFeatured && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          onToggleFeatured()
                        }}
                        aria-label="Mettre en avant"
                        title="Mettre en avant"
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Star className={clsx('w-4 h-4', item.is_featured && 'text-amber-500')} />
                        {item.is_featured ? 'Retirer des favoris' : 'Mettre en avant'}
                      </button>
                    )}
                    {onToggleVisibility && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          onToggleVisibility()
                        }}
                        aria-label={item.is_visible ? 'Masquer' : 'Afficher'}
                        title={item.is_visible ? 'Masquer' : 'Afficher'}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {item.is_visible ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Masquer
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Afficher
                          </>
                        )}
                      </button>
                    )}
                    {onDelete && (
                      <>
                        <div className="my-1 border-t border-gray-100" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowMenu(false)
                            onDelete()
                          }}
                          aria-label="Supprimer"
                          title="Supprimer"
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Description preview */}
        {item.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="px-2 py-0.5 text-gray-500 text-xs">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

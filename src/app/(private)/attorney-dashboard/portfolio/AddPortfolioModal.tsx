'use client'

import { useState } from 'react'
import {
  X,
  Image as ImageIcon,
  Video,
  Layers,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import Image from 'next/image'
import { FileDropzone } from '@/components/upload'
import Button from '@/components/ui/Button'
import type { PortfolioItem, MediaType, UploadedFile } from '@/types/portfolio'
import { PORTFOLIO_CATEGORIES } from '@/types/portfolio'

interface AddPortfolioModalProps {
  item?: PortfolioItem
  onClose: () => void
  onCreated: (item: PortfolioItem) => void
}

export default function AddPortfolioModal({
  item,
  onClose,
  onCreated,
}: AddPortfolioModalProps) {
  const isEditing = !!item
  const [step, setStep] = useState<'type' | 'upload' | 'details'>(
    isEditing ? 'details' : 'type'
  )
  const [mediaType, setMediaType] = useState<MediaType>(item?.media_type || 'image')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Uploaded files
  const [mainFile, setMainFile] = useState<UploadedFile | null>(
    item ? { url: item.image_url, fileName: '', fileSize: 0, mimeType: '' } : null
  )
  const [beforeFile, setBeforeFile] = useState<UploadedFile | null>(
    item?.before_image_url
      ? { url: item.before_image_url, fileName: '', fileSize: 0, mimeType: '' }
      : null
  )
  const [afterFile, setAfterFile] = useState<UploadedFile | null>(
    item?.after_image_url
      ? { url: item.after_image_url, fileName: '', fileSize: 0, mimeType: '' }
      : null
  )

  // Form data
  const [title, setTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || '')
  const [category, setCategory] = useState(item?.category || '')

  const handleFileUpload = async (files: File[], type: 'main' | 'before' | 'after') => {
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      // Get artisan ID from current user - we'll use a dummy for now
      // In production, this would come from the auth context
      const formData = new FormData()
      formData.append('file', files[0])
      formData.append('type', type)

      const response = await fetch('/api/portfolio/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'upload')
      }

      const data = await response.json()
      const uploaded: UploadedFile = {
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      }

      if (type === 'main') {
        setMainFile(uploaded)
      } else if (type === 'before') {
        setBeforeFile(uploaded)
      } else {
        setAfterFile(uploaded)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Le titre est requis')
      return
    }

    if (mediaType === 'before_after') {
      if (!beforeFile || !afterFile) {
        setError('Les images avant et après sont requises')
        return
      }
    } else if (!mainFile) {
      setError('Le fichier est requis')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        media_type: mediaType,
        image_url: mainFile?.url || beforeFile?.url || '',
        thumbnail_url: mainFile?.thumbnailUrl || null,
        video_url: mediaType === 'video' ? mainFile?.url : null,
        before_image_url: beforeFile?.url || null,
        after_image_url: afterFile?.url || null,
      }

      const url = isEditing ? `/api/portfolio/${item.id}` : '/api/portfolio'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      const data = await response.json()
      onCreated(data.item)
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const canProceedToDetails =
    mediaType === 'before_after'
      ? beforeFile && afterFile
      : mainFile

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Modifier' : 'Ajouter une réalisation'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Step 1: Type selection */}
          {step === 'type' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                Quel type de contenu souhaitez-vous ajouter ?
              </p>

              <button
                onClick={() => {
                  setMediaType('image')
                  setStep('upload')
                }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Image</h3>
                  <p className="text-sm text-gray-500">
                    Photo de vos réalisations
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setMediaType('video')
                  setStep('upload')
                }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Vidéo</h3>
                  <p className="text-sm text-gray-500">
                    Présentation vidéo de vos travaux
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setMediaType('before_after')
                  setStep('upload')
                }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Avant / Après</h3>
                  <p className="text-sm text-gray-500">
                    Comparez l'avant et l'après de vos travaux
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {mediaType === 'before_after' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Avant
                    </label>
                    {beforeFile ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <Image
                          src={beforeFile.url}
                          alt="Avant"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          onClick={() => setBeforeFile(null)}
                          className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <FileDropzone
                        accept="image"
                        maxFiles={1}
                        onFilesSelected={(files) => handleFileUpload(files, 'before')}
                        disabled={uploading}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Après
                    </label>
                    {afterFile ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <Image
                          src={afterFile.url}
                          alt="Après"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          onClick={() => setAfterFile(null)}
                          className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <FileDropzone
                        accept="image"
                        maxFiles={1}
                        onFilesSelected={(files) => handleFileUpload(files, 'after')}
                        disabled={uploading}
                      />
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mediaType === 'video' ? 'Vidéo' : 'Image'}
                  </label>
                  {mainFile ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                      {mediaType === 'video' ? (
                        <video
                          src={mainFile.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <Image
                          src={mainFile.url}
                          alt="Aperçu"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                      <button
                        onClick={() => setMainFile(null)}
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <FileDropzone
                      accept={mediaType === 'video' ? 'video' : 'image'}
                      maxFiles={1}
                      onFilesSelected={(files) => handleFileUpload(files, 'main')}
                      disabled={uploading}
                    />
                  )}
                </div>
              )}

              {uploading && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Upload en cours...</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('type')}>
                  Retour
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setStep('details')}
                  disabled={!canProceedToDetails || uploading}
                  className="flex-1"
                >
                  Continuer
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Rénovation salle de bain"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez les travaux réalisés..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {description.length}/500
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {PORTFOLIO_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                {!isEditing && (
                  <Button variant="outline" onClick={() => setStep('upload')}>
                    Retour
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={saving}
                  className="flex-1"
                >
                  {isEditing ? 'Enregistrer' : 'Ajouter au portfolio'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

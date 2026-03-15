'use client'

import { useState, useEffect } from 'react'
import { Loader2, Building2, Phone, MapPin, FileText, Euro, Award, Clock, Settings2, Camera, HelpCircle } from 'lucide-react'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import { IdentiteSection } from '@/components/attorney-dashboard/profil/IdentiteSection'
import { ContactSection } from '@/components/attorney-dashboard/profil/ContactSection'
import { LocalisationSection } from '@/components/attorney-dashboard/profil/LocalisationSection'
import { PresentationSection } from '@/components/attorney-dashboard/profil/PresentationSection'
import { ServicesTarifsSection } from '@/components/attorney-dashboard/profil/ServicesTarifsSection'
import { QualificationsSection } from '@/components/attorney-dashboard/profil/QualificationsSection'
import { DisponibiliteSection } from '@/components/attorney-dashboard/profil/DisponibiliteSection'
import { PreferencesSection } from '@/components/attorney-dashboard/profil/PreferencesSection'
import { FaqSection } from '@/components/attorney-dashboard/profil/FaqSection'
import { AvatarSection } from '@/components/attorney-dashboard/profil/AvatarSection'
import { getAttorneyUrl } from '@/lib/utils'

type TabId = 'identite' | 'contact' | 'localisation' | 'presentation' | 'services' | 'qualifications' | 'disponibilite' | 'faq' | 'preferences' | 'avatar'

const TABS = [
  { id: 'identite' as const, label: 'Identity', icon: Building2 },
  { id: 'contact' as const, label: 'Contact', icon: Phone },
  { id: 'localisation' as const, label: 'Location', icon: MapPin },
  { id: 'presentation' as const, label: 'About', icon: FileText },
  { id: 'services' as const, label: 'Services & Fees', icon: Euro },
  { id: 'qualifications' as const, label: 'Qualifications', icon: Award },
  { id: 'disponibilite' as const, label: 'Availability', icon: Clock },
  { id: 'faq' as const, label: 'FAQ', icon: HelpCircle },
  { id: 'preferences' as const, label: 'Preferences', icon: Settings2 },
  { id: 'avatar' as const, label: 'Profile Photo', icon: Camera },
]

export default function ProfilArtisanPage() {
  const [provider, setProvider] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('identite')

  useEffect(() => {
    fetch('/api/attorney/provider')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setProvider(data.provider)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Loading error'))
      .finally(() => setLoading(false))
  }, [])

  const handleSaved = (updated: Record<string, unknown>) => {
    setProvider(updated)
  }

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let newIndex: number | null = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      newIndex = (index + 1) % TABS.length
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      newIndex = (index - 1 + TABS.length) % TABS.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      newIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      newIndex = TABS.length - 1
    }
    if (newIndex !== null) {
      setActiveTab(TABS[newIndex].id)
      const tabEl = document.getElementById(`tab-${TABS[newIndex].id}`)
      tabEl?.focus()
    }
  }

  // Build public URL from provider data using the shared utility
  const publicUrl = provider ? getAttorneyUrl({
    stable_id: provider.stable_id as string | null,
    slug: provider.slug as string | null,
    specialty: provider.specialty as string | null,
    city: provider.address_city as string | null,
  }) : null

  // Only show the link if we have an identifier
  const showPublicUrl = provider && (provider.stable_id || provider.slug) ? publicUrl : null

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // No provider found
  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="font-semibold mb-2">Profile Not Found</h2>
            <p className="text-sm">{error || 'No attorney profile associated with your account. Contact support.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold">My Public Profile</h1>
          <p className="text-blue-100">Manage the information visible on your attorney page</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AttorneySidebar activePage="profil" publicUrl={showPublicUrl} />

            {/* Tab navigation */}
            <nav className="bg-white rounded-xl shadow-sm p-4 mt-4 space-y-1" aria-label="Profile sections" role="tablist" aria-orientation="vertical">
              {TABS.map((tab, index) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className={`w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div
            className="lg:col-span-3"
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'identite' && <IdentiteSection provider={provider} onSaved={handleSaved} />}
            {activeTab === 'contact' && <ContactSection provider={provider} onSaved={handleSaved} />}
            {activeTab === 'localisation' && <LocalisationSection provider={provider} onSaved={handleSaved} />}
            {activeTab === 'presentation' && <PresentationSection provider={provider} onSaved={handleSaved} />}
            {activeTab === 'services' && <ServicesTarifsSection provider={provider} onSaved={handleSaved} />}
            {activeTab === 'qualifications' && <QualificationsSection provider={provider} onSaved={handleSaved} />}
            {activeTab === 'disponibilite' && <DisponibiliteSection provider={provider} onSaved={handleSaved} />}
            {activeTab === 'faq' && <FaqSection provider={provider} onSaved={handleSaved} />}
            {activeTab === 'preferences' && <PreferencesSection provider={provider} onSaved={handleSaved} />}
            {activeTab === 'avatar' && <AvatarSection provider={provider} onSaved={handleSaved} />}
          </div>
        </div>
      </div>
    </div>
  )
}

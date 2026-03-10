"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  Wrench,
  Zap,
  Lock,
  Flame,
  Paintbrush,
  LayoutGrid,
  DoorOpen,
  Hammer,
  Home,
  Snowflake,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Calculator,
  ArrowRight,
  Check,
  Euro,
  Search,
  FileText,
  Users,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PriceRange {
  base: [number, number]
  unit: string
}

type InterventionKey = string

interface CategoryData {
  label: string
  slug: string
  icon: React.ReactNode
  interventions: Record<InterventionKey, { label: string; price: PriceRange }>
}

// ---------------------------------------------------------------------------
// Pricing data
// ---------------------------------------------------------------------------

const categories: Record<string, CategoryData> = {
  plomberie: {
    label: "Plomberie",
    slug: "plombier",
    icon: <Wrench className="h-6 w-6" />,
    interventions: {
      installation: { label: "Installation", price: { base: [200, 800], unit: "intervention" } },
      reparation: { label: "Réparation", price: { base: [80, 300], unit: "intervention" } },
      remplacement: { label: "Remplacement", price: { base: [150, 600], unit: "intervention" } },
      debouchage: { label: "Débouchage", price: { base: [100, 400], unit: "intervention" } },
    },
  },
  electricite: {
    label: "Électricité",
    slug: "electricien",
    icon: <Zap className="h-6 w-6" />,
    interventions: {
      mise_aux_normes: { label: "Mise aux normes", price: { base: [1000, 5000], unit: "logement" } },
      installation: { label: "Installation", price: { base: [150, 800], unit: "intervention" } },
      depannage: { label: "Dépannage", price: { base: [80, 350], unit: "intervention" } },
      tableau_electrique: { label: "Tableau électrique", price: { base: [800, 2500], unit: "installation" } },
    },
  },
  serrurerie: {
    label: "Serrurerie",
    slug: "serrurier",
    icon: <Lock className="h-6 w-6" />,
    interventions: {
      ouverture_porte: { label: "Ouverture de porte", price: { base: [80, 250], unit: "intervention" } },
      changement_serrure: { label: "Changement de serrure", price: { base: [100, 450], unit: "intervention" } },
      blindage_porte: { label: "Blindage de porte", price: { base: [800, 2500], unit: "installation" } },
      installation_digicode: { label: "Installation digicode", price: { base: [500, 1500], unit: "installation" } },
    },
  },
  chauffage: {
    label: "Chauffage",
    slug: "chauffagiste",
    icon: <Flame className="h-6 w-6" />,
    interventions: {
      entretien_chaudiere: { label: "Entretien chaudière", price: { base: [80, 200], unit: "intervention" } },
      installation_chaudiere: { label: "Installation chaudière", price: { base: [3000, 8000], unit: "installation" } },
      plancher_chauffant: { label: "Plancher chauffant", price: { base: [50, 120], unit: "m\u00B2" } },
      pompe_a_chaleur: { label: "Pompe à chaleur", price: { base: [8000, 18000], unit: "installation" } },
    },
  },
  peinture: {
    label: "Peinture",
    slug: "peintre",
    icon: <Paintbrush className="h-6 w-6" />,
    interventions: {
      peinture_interieure: { label: "Peinture intérieure", price: { base: [20, 45], unit: "m\u00B2" } },
      peinture_exterieure: { label: "Peinture extérieure", price: { base: [25, 55], unit: "m\u00B2" } },
      ravalement_facade: { label: "Ravalement de façade", price: { base: [30, 80], unit: "m\u00B2" } },
      laquage: { label: "Laquage / Finition", price: { base: [35, 70], unit: "m\u00B2" } },
    },
  },
  carrelage: {
    label: "Carrelage",
    slug: "carreleur",
    icon: <LayoutGrid className="h-6 w-6" />,
    interventions: {
      pose_carrelage: { label: "Pose de carrelage", price: { base: [30, 70], unit: "m\u00B2" } },
      pose_faience: { label: "Pose de faïence", price: { base: [35, 80], unit: "m\u00B2" } },
      chape: { label: "Chape / Ragréage", price: { base: [15, 35], unit: "m\u00B2" } },
      depose_ancien: { label: "Dépose ancien carrelage", price: { base: [15, 30], unit: "m\u00B2" } },
    },
  },
  menuiserie: {
    label: "Menuiserie",
    slug: "menuisier",
    icon: <DoorOpen className="h-6 w-6" />,
    interventions: {
      pose_fenetre: { label: "Pose de fenêtre", price: { base: [300, 800], unit: "fenêtre" } },
      pose_porte: { label: "Pose de porte", price: { base: [200, 600], unit: "porte" } },
      placard_sur_mesure: { label: "Placard sur mesure", price: { base: [800, 3000], unit: "installation" } },
      escalier: { label: "Escalier sur mesure", price: { base: [2000, 8000], unit: "installation" } },
    },
  },
  renovation: {
    label: "Rénovation générale",
    slug: "renovation",
    icon: <Hammer className="h-6 w-6" />,
    interventions: {
      renovation_complete: { label: "Rénovation complète", price: { base: [800, 1500], unit: "m\u00B2" } },
      renovation_partielle: { label: "Rénovation partielle", price: { base: [400, 800], unit: "m\u00B2" } },
      salle_de_bain: { label: "Salle de bain", price: { base: [5000, 15000], unit: "pièce" } },
      cuisine: { label: "Cuisine", price: { base: [8000, 25000], unit: "pièce" } },
    },
  },
  toiture: {
    label: "Toiture",
    slug: "couvreur",
    icon: <Home className="h-6 w-6" />,
    interventions: {
      reparation_toiture: { label: "Réparation toiture", price: { base: [300, 1500], unit: "intervention" } },
      refection_complete: { label: "Réfection complète", price: { base: [80, 200], unit: "m\u00B2" } },
      nettoyage_demoussage: { label: "Nettoyage / Démoussage", price: { base: [15, 35], unit: "m\u00B2" } },
      zinguerie: { label: "Zinguerie / Gouttières", price: { base: [40, 100], unit: "ml" } },
    },
  },
  isolation: {
    label: "Isolation",
    slug: "isolation",
    icon: <Snowflake className="h-6 w-6" />,
    interventions: {
      isolation_combles: { label: "Isolation des combles", price: { base: [20, 60], unit: "m\u00B2" } },
      isolation_murs: { label: "Isolation des murs", price: { base: [50, 120], unit: "m\u00B2" } },
      isolation_sol: { label: "Isolation du sol", price: { base: [30, 80], unit: "m\u00B2" } },
      isolation_exterieure: { label: "Isolation par l'extérieur (ITE)", price: { base: [100, 200], unit: "m\u00B2" } },
    },
  },
}

// ---------------------------------------------------------------------------
// Surface multipliers
// ---------------------------------------------------------------------------

const surfaceOptions = [
  { key: "petit", label: "Petit", description: "< 20m\u00B2 ou intervention simple", multiplier: 0.7 },
  { key: "moyen", label: "Moyen", description: "20-50m\u00B2 ou intervention standard", multiplier: 1.0 },
  { key: "grand", label: "Grand", description: "50-100m\u00B2 ou intervention complexe", multiplier: 1.5 },
  { key: "tres_grand", label: "Très grand", description: "> 100m\u00B2 ou chantier majeur", multiplier: 2.2 },
]

// ---------------------------------------------------------------------------
// Regional multipliers (simplified)
// ---------------------------------------------------------------------------

interface CityInfo {
  name: string
  slug: string
  region: string
  multiplier: number
}

const topCities: CityInfo[] = [
  { name: "Paris", slug: "paris", region: "\u00CEle-de-France", multiplier: 1.30 },
  { name: "Marseille", slug: "marseille", region: "Provence-Alpes-C\u00F4te d'Azur", multiplier: 1.15 },
  { name: "Lyon", slug: "lyon", region: "Auvergne-Rh\u00F4ne-Alpes", multiplier: 1.10 },
  { name: "Toulouse", slug: "toulouse", region: "Occitanie", multiplier: 1.05 },
  { name: "Nice", slug: "nice", region: "Provence-Alpes-C\u00F4te d'Azur", multiplier: 1.15 },
  { name: "Nantes", slug: "nantes", region: "Pays de la Loire", multiplier: 1.00 },
  { name: "Strasbourg", slug: "strasbourg", region: "Grand Est", multiplier: 1.00 },
  { name: "Montpellier", slug: "montpellier", region: "Occitanie", multiplier: 1.05 },
  { name: "Bordeaux", slug: "bordeaux", region: "Nouvelle-Aquitaine", multiplier: 1.05 },
  { name: "Lille", slug: "lille", region: "Hauts-de-France", multiplier: 0.95 },
  { name: "Rennes", slug: "rennes", region: "Bretagne", multiplier: 0.95 },
  { name: "Reims", slug: "reims", region: "Grand Est", multiplier: 0.95 },
  { name: "Saint-\u00C9tienne", slug: "saint-etienne", region: "Auvergne-Rh\u00F4ne-Alpes", multiplier: 1.00 },
  { name: "Toulon", slug: "toulon", region: "Provence-Alpes-C\u00F4te d'Azur", multiplier: 1.10 },
  { name: "Le Havre", slug: "le-havre", region: "Normandie", multiplier: 0.95 },
  { name: "Grenoble", slug: "grenoble", region: "Auvergne-Rh\u00F4ne-Alpes", multiplier: 1.05 },
  { name: "Dijon", slug: "dijon", region: "Bourgogne-Franche-Comt\u00E9", multiplier: 0.95 },
  { name: "Angers", slug: "angers", region: "Pays de la Loire", multiplier: 0.95 },
  { name: "N\u00EEmes", slug: "nimes", region: "Occitanie", multiplier: 1.00 },
  { name: "Villeurbanne", slug: "villeurbanne", region: "Auvergne-Rh\u00F4ne-Alpes", multiplier: 1.10 },
  { name: "Clermont-Ferrand", slug: "clermont-ferrand", region: "Auvergne-Rh\u00F4ne-Alpes", multiplier: 1.00 },
  { name: "Le Mans", slug: "le-mans", region: "Pays de la Loire", multiplier: 0.95 },
  { name: "Aix-en-Provence", slug: "aix-en-provence", region: "Provence-Alpes-C\u00F4te d'Azur", multiplier: 1.15 },
  { name: "Brest", slug: "brest", region: "Bretagne", multiplier: 0.95 },
  { name: "Tours", slug: "tours", region: "Centre-Val de Loire", multiplier: 0.95 },
  { name: "Amiens", slug: "amiens", region: "Hauts-de-France", multiplier: 0.90 },
  { name: "Limoges", slug: "limoges", region: "Nouvelle-Aquitaine", multiplier: 0.90 },
  { name: "Perpignan", slug: "perpignan", region: "Occitanie", multiplier: 1.00 },
  { name: "Metz", slug: "metz", region: "Grand Est", multiplier: 0.95 },
  { name: "Besan\u00E7on", slug: "besancon", region: "Bourgogne-Franche-Comt\u00E9", multiplier: 0.90 },
  { name: "Orl\u00E9ans", slug: "orleans", region: "Centre-Val de Loire", multiplier: 0.95 },
  { name: "Rouen", slug: "rouen", region: "Normandie", multiplier: 0.95 },
  { name: "Mulhouse", slug: "mulhouse", region: "Grand Est", multiplier: 0.95 },
  { name: "Caen", slug: "caen", region: "Normandie", multiplier: 0.95 },
  { name: "Nancy", slug: "nancy", region: "Grand Est", multiplier: 0.95 },
  { name: "Argenteuil", slug: "argenteuil", region: "\u00CEle-de-France", multiplier: 1.25 },
  { name: "Saint-Denis", slug: "saint-denis", region: "\u00CEle-de-France", multiplier: 1.25 },
  { name: "Montreuil", slug: "montreuil", region: "\u00CEle-de-France", multiplier: 1.25 },
  { name: "Roubaix", slug: "roubaix", region: "Hauts-de-France", multiplier: 0.90 },
  { name: "Tourcoing", slug: "tourcoing", region: "Hauts-de-France", multiplier: 0.90 },
  { name: "Avignon", slug: "avignon", region: "Provence-Alpes-C\u00F4te d'Azur", multiplier: 1.10 },
  { name: "Nanterre", slug: "nanterre", region: "\u00CEle-de-France", multiplier: 1.25 },
  { name: "Poitiers", slug: "poitiers", region: "Nouvelle-Aquitaine", multiplier: 0.90 },
  { name: "Versailles", slug: "versailles", region: "\u00CEle-de-France", multiplier: 1.30 },
  { name: "Cr\u00E9teil", slug: "creteil", region: "\u00CEle-de-France", multiplier: 1.25 },
  { name: "Pau", slug: "pau", region: "Nouvelle-Aquitaine", multiplier: 0.95 },
  { name: "Calais", slug: "calais", region: "Hauts-de-France", multiplier: 0.90 },
  { name: "La Rochelle", slug: "la-rochelle", region: "Nouvelle-Aquitaine", multiplier: 1.00 },
  { name: "Cannes", slug: "cannes", region: "Provence-Alpes-C\u00F4te d'Azur", multiplier: 1.20 },
  { name: "Antibes", slug: "antibes", region: "Provence-Alpes-C\u00F4te d'Azur", multiplier: 1.15 },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalculateurClient() {
  const [step, setStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(null)
  const [selectedSurface, setSelectedSurface] = useState<string | null>(null)
  const [citySearch, setCitySearch] = useState("")
  const [selectedCity, setSelectedCity] = useState<CityInfo | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const totalSteps = 5

  const filteredCities = useMemo(() => {
    if (!citySearch || citySearch.length < 2) return []
    const search = citySearch.toLowerCase()
    return topCities.filter((c) => c.name.toLowerCase().includes(search)).slice(0, 8)
  }, [citySearch])

  // Price calculation
  const result = useMemo(() => {
    if (!selectedCategory || !selectedIntervention || !selectedSurface || !selectedCity) return null

    const cat = categories[selectedCategory]
    const intervention = cat.interventions[selectedIntervention]
    const surface = surfaceOptions.find((s) => s.key === selectedSurface)
    if (!intervention || !surface) return null

    const [baseMin, baseMax] = intervention.price.base
    const surfaceMultiplier = surface.multiplier
    const regionalMultiplier = selectedCity.multiplier

    const rawMin = Math.round(baseMin * surfaceMultiplier * regionalMultiplier)
    const rawMax = Math.round(baseMax * surfaceMultiplier * regionalMultiplier)

    // Breakdown estimates
    const avgTotal = (rawMin + rawMax) / 2
    const mainOeuvre = Math.round(avgTotal * 0.55)
    const materiaux = Math.round(avgTotal * 0.35)
    const tva = Math.round(avgTotal * 0.10)

    return {
      min: rawMin,
      max: rawMax,
      mainOeuvre,
      materiaux,
      tva,
      unit: intervention.price.unit,
      categorySlug: cat.slug,
      categoryLabel: cat.label,
      interventionLabel: intervention.label,
      surfaceLabel: surface.label,
      cityName: selectedCity.name,
      citySlug: selectedCity.slug,
      regionName: selectedCity.region,
      regionalMultiplier,
    }
  }, [selectedCategory, selectedIntervention, selectedSurface, selectedCity])

  const canProceed = useCallback(() => {
    switch (step) {
      case 1: return !!selectedCategory
      case 2: return !!selectedIntervention
      case 3: return !!selectedSurface
      case 4: return !!selectedCity
      default: return false
    }
  }, [step, selectedCategory, selectedIntervention, selectedSurface, selectedCity])

  const handleNext = useCallback(() => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1)
    }
  }, [step, canProceed])

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1)
  }, [step])

  const handleCategorySelect = useCallback((key: string) => {
    setSelectedCategory(key)
    setSelectedIntervention(null)
    setTimeout(() => setStep(2), 200)
  }, [])

  const handleInterventionSelect = useCallback((key: string) => {
    setSelectedIntervention(key)
    setTimeout(() => setStep(3), 200)
  }, [])

  const handleSurfaceSelect = useCallback((key: string) => {
    setSelectedSurface(key)
    setTimeout(() => setStep(4), 200)
  }, [])

  const handleCitySelect = useCallback((city: CityInfo) => {
    setSelectedCity(city)
    setCitySearch(city.name)
    setShowSuggestions(false)
    setTimeout(() => setStep(5), 200)
  }, [])

  const handleReset = useCallback(() => {
    setStep(1)
    setSelectedCategory(null)
    setSelectedIntervention(null)
    setSelectedSurface(null)
    setSelectedCity(null)
    setCitySearch("")
  }, [])

  const formatPrice = (n: number) => n.toLocaleString("fr-FR")

  // Gauge percentage for visual display
  const gaugePercent = result ? Math.min(((result.min + result.max) / 2 / 30000) * 100, 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Calculator className="h-10 w-10" />
            <h1 className="text-3xl font-bold sm:text-4xl">Calculateur de Prix Travaux</h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-blue-100">
            Estimez gratuitement le coût de vos travaux en quelques clics.
            Prix ajustés selon votre région et la surface concernée.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
          {["Type de travaux", "Intervention", "Surface", "Localisation", "Résultat"].map((label, i) => (
            <span
              key={label}
              className={`hidden sm:inline ${step === i + 1 ? "font-semibold text-blue-600" : ""} ${
                step > i + 1 ? "text-green-600" : ""
              }`}
            >
              {step > i + 1 ? <Check className="mr-1 inline h-4 w-4" /> : null}
              {label}
            </span>
          ))}
          <span className="sm:hidden font-medium text-blue-600">
            Étape {Math.min(step, totalSteps)}/{totalSteps}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Step 1: Category */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Quel type de travaux souhaitez-vous réaliser ?
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Object.entries(categories).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => handleCategorySelect(key)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md ${
                    selectedCategory === key
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <span className={`rounded-lg p-2 transition-colors ${
                    selectedCategory === key
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    {cat.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Intervention type */}
        {step === 2 && selectedCategory && (
          <div className="animate-fadeIn">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Quelle intervention pour votre projet de {categories[selectedCategory].label.toLowerCase()} ?
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(categories[selectedCategory].interventions).map(([key, intv]) => (
                <button
                  key={key}
                  onClick={() => handleInterventionSelect(key)}
                  className={`flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md ${
                    selectedIntervention === key
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    selectedIntervention === key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    <ChevronRight className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900">{intv.label}</div>
                    <div className="text-sm text-gray-500">
                      {formatPrice(intv.price.base[0])} - {formatPrice(intv.price.base[1])} EUR / {intv.price.unit}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Surface */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Quelle est la surface ou l'ampleur du chantier ?
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {surfaceOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSurfaceSelect(opt.key)}
                  className={`flex flex-col rounded-xl border-2 p-5 text-left transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md ${
                    selectedSurface === opt.key
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="text-lg font-bold text-gray-900">{opt.label}</span>
                  <span className="mt-1 text-sm text-gray-500">{opt.description}</span>
                  <span className="mt-2 text-xs font-medium text-blue-600">
                    Coefficient : x{opt.multiplier}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: City */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Dans quelle ville se situe votre chantier ?
            </h2>
            <div className="relative mx-auto max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value)
                    setShowSuggestions(true)
                    setSelectedCity(null)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Tapez le nom de votre ville..."
                  className="w-full rounded-xl border-2 border-gray-200 py-4 pl-11 pr-4 text-lg outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {showSuggestions && filteredCities.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {filteredCities.map((city) => (
                    <button
                      key={city.slug}
                      onClick={() => handleCitySelect(city)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-50"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                      <div>
                        <span className="font-medium text-gray-900">{city.name}</span>
                        <span className="ml-2 text-sm text-gray-500">{city.region}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {citySearch.length >= 2 && filteredCities.length === 0 && showSuggestions && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white p-4 text-center text-gray-500 shadow-lg">
                  Ville non trouvée dans notre liste. Essayez une grande ville proche.
                </div>
              )}

              {selectedCity && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
                  <Check className="h-5 w-5" />
                  <span>
                    <strong>{selectedCity.name}</strong> — coefficient régional : x{selectedCity.multiplier}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && result && (
          <div className="animate-fadeIn space-y-6">
            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Estimation de votre projet
            </h2>
            <p className="mb-6 text-center text-gray-500">
              {result.interventionLabel} ({result.categoryLabel}) - {result.surfaceLabel} - {result.cityName}
            </p>

            {/* Price gauge card */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
                  <Euro className="h-4 w-4" />
                  Fourchette de prix estimée
                </div>
              </div>
              <div className="p-6">
                {/* Price display */}
                <div className="mb-6 flex items-end justify-center gap-2">
                  <span className="text-4xl font-bold text-blue-600 sm:text-5xl">
                    {formatPrice(result.min)} - {formatPrice(result.max)}
                  </span>
                  <span className="mb-1 text-lg text-gray-500">EUR</span>
                </div>
                <div className="mb-6 text-center text-sm text-gray-500">
                  par {result.unit} (TTC estimé)
                </div>

                {/* Visual gauge */}
                <div className="mb-6">
                  <div className="relative h-4 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-700"
                      style={{ width: `${gaugePercent}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-1 bg-blue-700"
                      style={{ left: `${gaugePercent}%`, transform: "translateX(-50%)" }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>Budget modéré</span>
                    <span>Budget élevé</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                  <h3 className="font-semibold text-gray-800">Répartition estimée</h3>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Main-d'oeuvre</span>
                    <span className="font-medium text-gray-900">{formatPrice(result.mainOeuvre)} EUR</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Matériaux (estimés)</span>
                    <span className="font-medium text-gray-900">{formatPrice(result.materiaux)} EUR</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">TVA (10 % rénovation)</span>
                    <span className="font-medium text-gray-900">{formatPrice(result.tva)} EUR</span>
                  </div>
                </div>

                {/* Regional info */}
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Les tarifs à <strong>{result.cityName}</strong> ({result.regionName}) sont{" "}
                    {result.regionalMultiplier > 1.1
                      ? "supérieurs"
                      : result.regionalMultiplier < 0.95
                        ? "inférieurs"
                        : "proches"}{" "}
                    de la moyenne nationale (coefficient : x{result.regionalMultiplier}).
                  </span>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                href={`/devis/${result.categorySlug}/${result.citySlug}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-4 text-center font-bold text-white shadow-lg transition-all hover:bg-amber-600 hover:shadow-xl"
              >
                <FileText className="h-5 w-5" />
                Demander un devis gratuit
              </Link>
              <Link
                href={`/tarifs/${result.categorySlug}/${result.citySlug}`}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-4 text-center font-bold text-blue-600 transition-all hover:bg-blue-50"
              >
                <Euro className="h-5 w-5" />
                Tarifs détaillés
              </Link>
              <Link
                href={`/services/${result.categorySlug}/${result.citySlug}`}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-4 text-center font-bold text-gray-700 transition-all hover:bg-gray-50"
              >
                <Users className="h-5 w-5" />
                Trouver un artisan
              </Link>
            </div>

            {/* Reset button */}
            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-sm font-medium text-blue-600 underline-offset-2 hover:underline"
              >
                Recommencer une estimation
              </button>
            </div>
          </div>
        )}

        {/* Navigation buttons (steps 2-4) */}
        {step >= 2 && step <= 4 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour
            </button>
            {step < 4 || selectedCity ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex items-center gap-2 rounded-lg px-6 py-2 font-medium transition-all ${
                  canProceed()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                Suivant
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        )}

        {/* Step 5 back button */}
        {step === 5 && (
          <div className="mt-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
              Modifier ma recherche
            </button>
          </div>
        )}
      </div>

      {/* FAQ Section for SEO */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Questions fréquentes</h2>
        <div className="space-y-4">
          {[
            {
              q: "Comment fonctionne le calculateur de prix travaux ?",
              a: "Notre calculateur estime le coût de vos travaux en 4 étapes : vous sélectionnez le type de travaux, la nature de l'intervention, la surface concernée et votre ville. Le prix est calculé en fonction des tarifs moyens du marché, ajustés selon votre région et l'ampleur du chantier.",
            },
            {
              q: "Les prix affichés sont-ils garantis ?",
              a: "Les prix affichés sont des estimations basées sur les tarifs moyens constatés en France en 2026. Le coût réel peut varier selon l'artisan, la complexité du chantier et les matériaux choisis. Demandez toujours un devis détaillé à un professionnel.",
            },
            {
              q: "Pourquoi les prix varient-ils selon la région ?",
              a: "Les tarifs varient selon le coût de la vie, la densité de professionnels et la demande locale. L'\u00CEle-de-France et la C\u00F4te d'Azur affichent des tarifs 15 à 25 % supérieurs à la moyenne nationale.",
            },
            {
              q: "Le calculateur prend-il en compte la TVA ?",
              a: "Oui, les résultats incluent une estimation de la TVA à 10 % (taux réduit pour la rénovation dans un logement de plus de 2 ans). Pour les travaux d'amélioration énergétique, la TVA peut être de 5,5 %.",
            },
            {
              q: "Comment obtenir un devis précis après l'estimation ?",
              a: "Cliquez sur \"Demander un devis gratuit\" pour être mis en relation avec des artisans qualifiés de votre ville. Vous recevrez jusqu'à 3 devis détaillés et personnalisés, sans engagement.",
            },
          ].map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-gray-200 bg-white"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-gray-100 px-5 py-4 text-gray-600">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* CSS animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

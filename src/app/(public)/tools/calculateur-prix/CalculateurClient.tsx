'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Wrench, Zap, Key, Flame, PaintBucket, Hammer,
  Grid3X3, Home, TreeDeciduous, Square, Wind, ChefHat,
  Layers, Sparkles, ArrowRight, ArrowLeft, MapPin,
  CheckCircle, Euro, Calculator, Search,
  Shovel, Axe, Droplets, Shield, Building, Paintbrush, Construction,
  Link as LinkIcon, Maximize, PanelTop, Bath, Ruler, Palette,
  Cpu, Thermometer, Sun, Snowflake, Leaf, PlugZap, Factory, Trees,
  Waves, ShieldAlert, Radio, ArrowUpDown, ClipboardCheck, Bug, Truck,
} from 'lucide-react'
/* ── Icon map ────────────────────────────────────────────── */
const iconMap: Record<string, React.ElementType> = {
  Wrench, Zap, Key, Flame, PaintBucket, Hammer,
  Grid3X3, Home, Blocks: Grid3X3, TreeDeciduous, Square,
  Wind, ChefHat, Layers, Sparkles,
  Shovel, Axe, Droplets, Shield, Building, Paintbrush, Construction,
  Link: LinkIcon, Maximize, PanelTop, Bath, Ruler, Palette,
  Cpu, Thermometer, Sun, Snowflake, Leaf, PlugZap, Factory, Trees,
  Waves, ShieldAlert, Radio, ArrowUpDown, ClipboardCheck, Bug, Truck,
}

/* ── Types ───────────────────────────────────────────────── */
interface ServiceItem {
  slug: string
  name: string
  icon: string
  color: string
}

interface TradeData {
  slug: string
  name: string
  priceRange: { min: number; max: number; unit: string }
  commonTasks: string[]
  tips: string[]
  faq: { q: string; a: string }[]
}

interface ParsedTask {
  name: string
  priceMin: number
  priceMax: number
  raw: string
}

interface CalculateurClientProps {
  services: ServiceItem[]
  tradeContent: Record<string, TradeData>
}

/* ── Task parser ─────────────────────────────────────────── */
function parseTask(task: string): ParsedTask {
  // Pattern: "Task name : MIN to/a MAX EUR"
  const match = task.match(/^(.+?)\s*:\s*([\d\s]+)\s*(?:à|a)\s*([\d\s]+)\s*/)
  if (match) {
    return {
      name: match[1].trim(),
      priceMin: parseInt(match[2].replace(/\s/g, ''), 10),
      priceMax: parseInt(match[3].replace(/\s/g, ''), 10),
      raw: task,
    }
  }
  // Fallback: just the task name, no price
  return { name: task, priceMin: 0, priceMax: 0, raw: task }
}

/* ── Component ───────────────────────────────────────────── */
export default function CalculateurClient({ services, tradeContent }: CalculateurClientProps) {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<ParsedTask | null>(null)
  const [city, setCity] = useState('')

  const trade = selectedService ? tradeContent[selectedService] : null

  const parsedTasks = useMemo(() => {
    if (!trade) return []
    return trade.commonTasks.map(parseTask)
  }, [trade])

  const serviceItem = services.find((s) => s.slug === selectedService)

  function handleServiceSelect(slug: string) {
    setSelectedService(slug)
    setSelectedTask(null)
    setCity('')
    setStep(2)
  }

  function handleTaskSelect(task: ParsedTask) {
    setSelectedTask(task)
    setStep(3)
  }

  function handleShowResult() {
    setStep(4)
  }

  function handleReset() {
    setStep(1)
    setSelectedService(null)
    setSelectedTask(null)
    setCity('')
  }

  function handleBack() {
    if (step === 2) {
      setStep(1)
      setSelectedService(null)
      setSelectedTask(null)
      setCity('')
    } else if (step === 3) {
      setStep(2)
      setSelectedTask(null)
      setCity('')
    } else if (step === 4) {
      setStep(3)
    }
  }

  /* ── Step indicators ─────────────────────────────────── */
  const steps = [
    { num: 1, label: 'Service' },
    { num: 2, label: 'Prestation' },
    { num: 3, label: 'Localisation' },
    { num: 4, label: 'Estimation' },
  ]

  return (
    <div className="max-w-5xl mx-auto">

      {/* Progress bar */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= s.num
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.num ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  s.num
                )}
              </div>
              <span className={`hidden sm:inline text-sm font-medium transition-colors ${
                step >= s.num ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 transition-colors duration-300 ${
                step > s.num ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Back button */}
      {step > 1 && (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      )}

      {/* ── Step 1: Select service ───────────────────────── */}
      <div className={`transition-all duration-500 ${step === 1 ? 'opacity-100' : 'hidden'}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Quel type d&apos;artisan recherchez-vous ?
        </h2>
        <p className="text-gray-500 text-center mb-8">
          S&eacute;lectionnez un m&eacute;tier pour obtenir une estimation de prix
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || Wrench
            return (
              <button
                key={service.slug}
                onClick={() => handleServiceSelect(service.slug)}
                className="group relative bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-center"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r ${service.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800 leading-tight block">
                  {service.name}
                </span>
                {tradeContent[service.slug] && (
                  <span className="text-xs text-gray-400 mt-1 block">
                    {tradeContent[service.slug].priceRange.min}&ndash;{tradeContent[service.slug].priceRange.max} {tradeContent[service.slug].priceRange.unit}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Step 2: Select task ──────────────────────────── */}
      <div className={`transition-all duration-500 ${step === 2 ? 'opacity-100' : 'hidden'}`}>
        {trade && serviceItem && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Quelle prestation souhaitez-vous ?
            </h2>
            <p className="text-gray-500 text-center mb-8">
              Prestations courantes pour un <span className="font-medium text-gray-700">{trade.name.toLowerCase()}</span>
            </p>
            <div className="space-y-3 max-w-2xl mx-auto">
              {parsedTasks.map((task, i) => (
                <button
                  key={i}
                  onClick={() => handleTaskSelect(task)}
                  className="w-full flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Euro className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm sm:text-base font-medium text-gray-800 block leading-snug">
                        {task.name}
                      </span>
                      {task.priceMin > 0 && (
                        <span className="text-sm text-blue-600 font-semibold mt-1 block">
                          {task.priceMin.toLocaleString('fr-FR')} &ndash; {task.priceMax.toLocaleString('fr-FR')} &euro;
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                </button>
              ))}

              {/* Hourly rate option */}
              <button
                onClick={() => handleTaskSelect({
                  name: `Tarif horaire ${trade.name.toLowerCase()}`,
                  priceMin: trade.priceRange.min,
                  priceMax: trade.priceRange.max,
                  raw: `Tarif horaire : ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}`,
                })}
                className="w-full flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calculator className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-medium text-blue-800 block">
                      Tarif horaire g&eacute;n&eacute;ral
                    </span>
                    <span className="text-sm text-blue-600 font-semibold mt-0.5 block">
                      {trade.priceRange.min} &ndash; {trade.priceRange.max} {trade.priceRange.unit}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-300 group-hover:text-blue-600 flex-shrink-0 transition-colors" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Step 3: City (optional) ──────────────────────── */}
      <div className={`transition-all duration-500 ${step === 3 ? 'opacity-100' : 'hidden'}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Dans quelle ville ? <span className="text-gray-400 text-lg font-normal">(facultatif)</span>
        </h2>
        <p className="text-gray-500 text-center mb-8">
          Les prix peuvent varier selon la r&eacute;gion. Indiquez votre ville pour contextualiser l&apos;estimation.
        </p>
        <div className="max-w-md mx-auto">
          <div className="relative mb-6">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex : Paris, Lyon, Marseille..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-800 text-lg transition-all"
            />
          </div>
          <button
            onClick={handleShowResult}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            <Calculator className="w-5 h-5" />
            Voir l&apos;estimation
          </button>
          <button
            onClick={() => { setCity(''); handleShowResult() }}
            className="w-full text-gray-500 py-3 text-sm hover:text-gray-700 transition-colors mt-2"
          >
            Passer cette &eacute;tape
          </button>
        </div>
      </div>

      {/* ── Step 4: Result ───────────────────────────────── */}
      <div className={`transition-all duration-500 ${step === 4 ? 'opacity-100' : 'hidden'}`}>
        {trade && selectedTask && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-w-2xl mx-auto">
              {/* Result header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sm:p-8 text-center">
                <p className="text-blue-200 text-sm font-medium mb-2">Estimation de prix</p>
                <h3 className="text-xl sm:text-2xl font-bold mb-1">
                  {selectedTask.name}
                </h3>
                <p className="text-blue-200 text-sm">
                  {trade.name}{city ? ` · ${city}` : ''}
                </p>
              </div>

              {/* Price display */}
              <div className="p-6 sm:p-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 text-center mb-6">
                  <p className="text-sm text-gray-600 mb-2">Fourchette de prix estim&eacute;e</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl sm:text-5xl font-bold text-blue-600">
                      {selectedTask.priceMin.toLocaleString('fr-FR')} &ndash; {selectedTask.priceMax.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-gray-600 text-lg">&euro;</span>
                  </div>
                  {city && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Les prix peuvent varier selon votre localisation exacte
                    </p>
                  )}
                </div>

                {/* Tips */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Conseils
                  </h4>
                  <ul className="space-y-2">
                    {trade.tips.slice(0, 3).map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hourly rate context */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Euro className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Tarif horaire de r&eacute;f&eacute;rence</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {trade.priceRange.min} &ndash; {trade.priceRange.max} {trade.priceRange.unit} en moyenne
                  </p>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <Link
                    href={city
                      ? `/practice-areas/${selectedService}/${city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
                      : `/practice-areas/${selectedService}`
                    }
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    <Search className="w-5 h-5" />
                    Trouver un {trade.name.toLowerCase()}{city ? ` à ${city}` : ''}
                  </Link>
                  <Link
                    href="/quotes"
                    className="flex items-center justify-center gap-2 w-full bg-white text-blue-600 border-2 border-blue-200 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
                  >
                    Demander un devis gratuit
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* New estimation */}
            <div className="text-center mt-8">
              <button
                onClick={handleReset}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                Faire une nouvelle estimation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

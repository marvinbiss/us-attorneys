'use client'

import { useState, useCallback } from 'react'
import {
  ProgressBar,
  CategoryStep,
  SubCategoryStep,
  TimelineStep,
  StateStep,
  UrgencyStep,
} from '@/components/tools/AssessmentQuestion'
import AssessmentResult from '@/components/tools/AssessmentResult'
import {
  assessmentCategories,
  getRecommendation,
  type Category,
  type SubCategory,
  type UrgencyLevel,
  type AssessmentRecommendation,
} from '@/lib/diagnostic/assessment-engine'

type Step = 1 | 2 | 3 | 4 | 5 | 'result'

export default function AssessmentClient() {
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back

  // Answers
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null)
  const [timelineMonths, setTimelineMonths] = useState<number | undefined>(undefined)
  const [stateCode, setStateCode] = useState<string | undefined>(undefined)
  const [recommendation, setRecommendation] = useState<AssessmentRecommendation | null>(null)

  const TOTAL_STEPS = 5

  const goForward = useCallback((nextStep: Step) => {
    setDirection(1)
    setStep(nextStep)
  }, [])

  const goBack = useCallback(() => {
    setDirection(-1)
    if (step === 2) {
      setSelectedCategory(null)
      setStep(1)
    } else if (step === 3) {
      setSelectedSubCategory(null)
      setStep(2)
    } else if (step === 4) {
      setTimelineMonths(undefined)
      setStep(3)
    } else if (step === 5) {
      setStateCode(undefined)
      setStep(4)
    } else if (step === 'result') {
      setStep(5)
    }
  }, [step])

  const handleRestart = useCallback(() => {
    setDirection(-1)
    setSelectedCategory(null)
    setSelectedSubCategory(null)
    setTimelineMonths(undefined)
    setStateCode(undefined)
    setRecommendation(null)
    setStep(1)
  }, [])

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat)
    goForward(2)
  }

  const handleSubCategorySelect = (sub: SubCategory) => {
    setSelectedSubCategory(sub)
    goForward(3)
  }

  const handleTimelineSelect = (months: number) => {
    setTimelineMonths(months)
    goForward(4)
  }

  const handleStateSelect = (code: string) => {
    setStateCode(code)
    goForward(5)
  }

  const handleUrgencySelect = (urgency: UrgencyLevel) => {
    if (!selectedCategory || !selectedSubCategory) return
    const rec = getRecommendation({
      categoryId: selectedCategory.id,
      subCategoryId: selectedSubCategory.id,
      timelineMonths,
      stateCode,
      urgency,
    })
    setRecommendation(rec)
    goForward('result')
  }

  const currentStepNum = step === 'result' ? TOTAL_STEPS : (step as number)

  return (
    <div className="max-w-3xl mx-auto">
      {step !== 'result' && (
        <ProgressBar
          currentStep={currentStepNum}
          totalSteps={TOTAL_STEPS}
          onBack={goBack}
          canGoBack={step !== 1}
        />
      )}

      {step === 1 && (
        <CategoryStep
          categories={assessmentCategories}
          onSelect={handleCategorySelect}
          direction={direction}
        />
      )}

      {step === 2 && selectedCategory && (
        <SubCategoryStep
          category={selectedCategory}
          onSelect={handleSubCategorySelect}
          direction={direction}
        />
      )}

      {step === 3 && (
        <TimelineStep
          onSelect={handleTimelineSelect}
          direction={direction}
        />
      )}

      {step === 4 && (
        <StateStep
          onSelect={handleStateSelect}
          direction={direction}
        />
      )}

      {step === 5 && (
        <UrgencyStep
          onSelect={handleUrgencySelect}
          direction={direction}
        />
      )}

      {step === 'result' && recommendation && (
        <AssessmentResult
          recommendation={recommendation}
          stateCode={stateCode}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}

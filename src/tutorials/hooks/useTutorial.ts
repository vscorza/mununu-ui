import { useState, useCallback } from 'react'
import { useAppStore } from '../../store/appStore'
import { TutorialStep } from '../types'

export const useTutorial = (tutorialId: string, steps: TutorialStep[]) => {
  const { tutorialStep, setTutorialStep, setTutorialActive, completeTutorial } = useAppStore()
  const [isActive, setIsActive] = useState(false)

  const startTutorial = useCallback(() => {
    setTutorialActive(true)
    setTutorialStep(0)
    setIsActive(true)
  }, [setTutorialActive, setTutorialStep])

  const closeTutorial = useCallback(() => {
    setTutorialActive(false)
    setTutorialStep(0)
    setIsActive(false)
  }, [setTutorialActive, setTutorialStep])

  const nextStep = useCallback(() => {
    if (tutorialStep < steps.length - 1) {
      setTutorialStep(tutorialStep + 1)
    } else {
      completeTutorial(tutorialId)
      closeTutorial()
    }
  }, [tutorialStep, steps.length, setTutorialStep, completeTutorial, tutorialId, closeTutorial])

  const prevStep = useCallback(() => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1)
    }
  }, [tutorialStep, setTutorialStep])

  return {
    isActive,
    currentStep: tutorialStep,
    steps,
    startTutorial,
    closeTutorial,
    nextStep,
    prevStep,
  }
}

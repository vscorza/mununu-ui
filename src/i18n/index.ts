import { en } from './locales/en'
import { es } from './locales/es'
import { pt } from './locales/pt'

export type Language = 'en' | 'es' | 'pt'

export const translations = {
  en,
  es,
  pt,
}

export type TranslationKeys = typeof en

export const getTranslation = (lang: Language): TranslationKeys => {
  return translations[lang] || translations.en
}

// Helper function to get nested translation value
export const t = (lang: Language, path: string): string => {
  const translation = getTranslation(lang)
  const keys = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translation

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key as keyof typeof value]
    } else {
      console.warn(`Translation key not found: ${path}`)
      return path
    }
  }

  return typeof value === 'string' ? value : path
}

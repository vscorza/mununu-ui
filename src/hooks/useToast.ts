import { toast, ToastOptions } from 'react-hot-toast'
import type React from 'react'

export const useToast = () => {
  const showSuccess = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: 3000,
      ...options,
    })
  }

  const showError = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: 4000,
      ...options,
    })
  }

  const showInfo = (message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: 3000,
      icon: 'ℹ️',
      ...options,
    })
  }

  const showLoading = (message: string) => {
    return toast.loading(message)
  }

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId)
  }

  const showCustom = (content: React.ReactNode, options?: ToastOptions) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return toast.custom(content as any, {
      duration: options?.duration || 4000,
      ...options,
    })
  }

  return {
    showSuccess,
    showError,
    showInfo,
    showLoading,
    showCustom,
    dismiss,
  }
}

import { useEffect, useState } from 'react'

export interface AppAlertButton {
  text: string
  style?: 'default' | 'cancel' | 'destructive'
  onPress?: () => void
}

export interface AppAlertState {
  id: number
  title: string
  message?: string
  buttons: AppAlertButton[]
}

type Listener = (state: AppAlertState | null) => void

let current: AppAlertState | null = null
let seq = 0
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener(current)
}

export function showAppAlert(title: string, message?: string, buttons?: AppAlertButton[]): void {
  current = {
    id: ++seq,
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'Entendido' }],
  }
  emit()
}

export function dismissAppAlert(): void {
  current = null
  emit()
}

export function useAppAlert(): AppAlertState | null {
  const [state, setState] = useState(current)

  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  return state
}

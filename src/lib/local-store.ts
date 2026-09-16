import AsyncStorage from '@react-native-async-storage/async-storage'

export async function leerJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function escribirJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export async function borrarClave(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key)
  } catch {
    return
  }
}

export async function leerTexto(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key)
  } catch {
    return null
  }
}

export async function escribirTexto(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value)
  } catch {
    return
  }
}

export async function clavesConPrefijo(prefijo: string): Promise<string[]> {
  try {
    const todas = await AsyncStorage.getAllKeys()
    return todas.filter((k) => k.startsWith(prefijo))
  } catch {
    return []
  }
}

export async function borrarClaves(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    await AsyncStorage.multiRemove(keys)
  } catch {
    return
  }
}

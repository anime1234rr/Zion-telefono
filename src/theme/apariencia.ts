import { Appearance, DevSettings } from 'react-native'
import * as Updates from 'expo-updates'

import { ACENTOS, aplicarPaleta } from '@/theme/colors'
import { aplicarEscalas } from '@/theme/theme'
import { escribirJSON, leerJSON } from '@/lib/local-store'

export type ModoTema = 'sistema' | 'oscuro' | 'claro'
export type Densidad = 'compacta' | 'normal' | 'comoda'
export type Esquinas = 'cuadrado' | 'suave' | 'normal' | 'redondo'
export type TamanoFuente = 'chico' | 'normal' | 'grande' | 'muy-grande'

export interface PreferenciasApariencia {
  tema: ModoTema
  acento: string
  densidad: Densidad
  esquinas: Esquinas
  fuente: TamanoFuente
}

const CLAVE = 'zion:apariencia'

export const APARIENCIA_POR_DEFECTO: PreferenciasApariencia = {
  tema: 'oscuro',
  acento: ACENTOS[0].color,
  densidad: 'normal',
  esquinas: 'normal',
  fuente: 'normal',
}

const FACTOR_DENSIDAD: Record<Densidad, number> = { compacta: 0.8, normal: 1, comoda: 1.2 }
const FACTOR_ESQUINAS: Record<Esquinas, number> = { cuadrado: 0.25, suave: 0.6, normal: 1, redondo: 1.6 }
const FACTOR_FUENTE: Record<TamanoFuente, number> = { chico: 0.9, normal: 1, grande: 1.12, 'muy-grande': 1.25 }

let actual: PreferenciasApariencia = APARIENCIA_POR_DEFECTO

export async function leerApariencia(): Promise<PreferenciasApariencia> {
  const guardado = await leerJSON<Partial<PreferenciasApariencia>>(CLAVE, {})
  actual = { ...APARIENCIA_POR_DEFECTO, ...guardado }
  return actual
}

export function aparienciaActual(): PreferenciasApariencia {
  return actual
}

export function esClaro(pref: PreferenciasApariencia): boolean {
  if (pref.tema === 'sistema') return Appearance.getColorScheme() === 'light'
  return pref.tema === 'claro'
}

export function aplicarApariencia(pref: PreferenciasApariencia): void {
  actual = pref
  aplicarPaleta(esClaro(pref), pref.acento)
  aplicarEscalas(FACTOR_FUENTE[pref.fuente], FACTOR_DENSIDAD[pref.densidad], FACTOR_ESQUINAS[pref.esquinas])
}

export async function recargarApp(): Promise<void> {
  try {
    await Updates.reloadAsync()
  } catch {
    DevSettings.reload()
  }
}

export async function guardarApariencia(pref: PreferenciasApariencia): Promise<void> {
  await escribirJSON(CLAVE, pref)
  actual = pref
  await recargarApp()
}

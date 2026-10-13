const BASE_SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
const BASE_RADIUS = { sm: 6, md: 10, lg: 14, xl: 20, full: 999 }
const BASE_FONT = { xs: 12, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24 }

export const spacing = { ...BASE_SPACING }
export const radius = { ...BASE_RADIUS }
export const fontSize = { ...BASE_FONT }

function escalar<T extends Record<string, number>>(destino: T, base: T, factor: number, excluir: string[] = []): void {
  for (const clave of Object.keys(base) as (keyof T)[]) {
    const valor = base[clave]
    ;(destino as Record<keyof T, number>)[clave] = excluir.includes(String(clave)) ? valor : Math.round(valor * factor)
  }
}

export function aplicarEscalas(fuente: number, densidad: number, esquinas: number): void {
  escalar(fontSize, BASE_FONT, fuente)
  escalar(spacing, BASE_SPACING, densidad)
  escalar(radius, BASE_RADIUS, esquinas, ['full'])
}

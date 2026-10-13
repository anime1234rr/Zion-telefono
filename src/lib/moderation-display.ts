import type { EstadoCuenta, TipoRolStaff, TipoSancion } from '@/lib/moderation'
import { colors } from '@/theme/colors'

export const ETIQUETA_TIPO_SANCION: Record<TipoSancion, string> = {
  advertencia: 'Advertencia',
  ban_temporal: 'Suspensión temporal',
  ban_permanente: 'Suspensión permanente',
}

export const ETIQUETA_ROL_STAFF: Record<TipoRolStaff, string> = {
  core_dev: 'Desarrollador Core',
  frontend_dev: 'Desarrollador UI/UX',
  moderador: 'Moderador',
}

export const ESTADO_CUENTA_CONFIG: Record<EstadoCuenta, { label: string; color: string }> = {
  activo: { label: 'Activo', color: colors.online },
  advertido: { label: 'Advertido', color: colors.idle },
  ban_temporal: { label: 'Ban temporal', color: colors.destructive },
  ban_permanente: { label: 'Suspendido', color: colors.destructive },
}

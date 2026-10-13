import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useInsigniaUsuario, type Insignia } from '@/lib/badges'
import { colors } from '@/theme/colors'

const CONFIG: Record<Insignia, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  fundador: { label: 'Fundador de Zion', icon: 'crown', color: colors.idle },
  core_dev: { label: 'Desarrollador Core', icon: 'console', color: colors.primary },
  frontend_dev: { label: 'Desarrollador UI/UX', icon: 'palette-outline', color: colors.primary },
  moderador: { label: 'Moderador', icon: 'shield-check', color: colors.online },
}

export function UserBadge({ userId, size = 14 }: { userId: string; size?: number }) {
  const insignia = useInsigniaUsuario(userId)
  if (!insignia) return null
  const config = CONFIG[insignia]
  return (
    <MaterialCommunityIcons
      name={config.icon}
      size={size}
      color={config.color}
      accessibilityLabel={config.label}
    />
  )
}

export function etiquetaInsignia(insignia: Insignia): string {
  return CONFIG[insignia].label
}

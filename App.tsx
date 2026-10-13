import { useEffect, useState, type ComponentType } from 'react'
import { View } from 'react-native'

import { aplicarApariencia, leerApariencia } from '@/theme/apariencia'
import { colors } from '@/theme/colors'

export default function App() {
  const [Raiz, setRaiz] = useState<ComponentType | null>(null)

  useEffect(() => {
    leerApariencia()
      .then(aplicarApariencia)
      .catch(() => {})
      .finally(() => {
        import('./src/AppRoot').then((m) => setRaiz(() => m.AppRoot))
      })
  }, [])

  if (!Raiz) return <View style={{ flex: 1, backgroundColor: colors.background }} />
  return <Raiz />
}

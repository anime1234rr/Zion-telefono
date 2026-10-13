import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { ScreenContainer } from '@/components/ScreenContainer'
import {
  agruparCanalesPorCategoria,
  type PlantillaCanalPreview,
  type PlantillaServidorDetalle,
} from '@/lib/templates'
import { alfa, colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const iconByType: Record<string, keyof typeof Ionicons.glyphMap> = {
  texto: 'chatbubble-outline',
  voz: 'volume-medium-outline',
  codigo: 'code-slash-outline',
  anuncios: 'megaphone-outline',
}

interface PlantillaServidorPreviewProps {
  visible: boolean
  plantilla: PlantillaServidorDetalle
  nombreServidor: string
  creating: boolean
  onClose: () => void
  onCreate: () => void
}

export function PlantillaServidorPreview({
  visible,
  plantilla,
  nombreServidor,
  creating,
  onClose,
  onCreate,
}: PlantillaServidorPreviewProps) {
  const [canalActivo, setCanalActivo] = useState<PlantillaCanalPreview | null>(null)
  const grupos = agruparCanalesPorCategoria(plantilla.canales)
  const nombre = nombreServidor.trim() || plantilla.nombre

  function cerrar() {
    setCanalActivo(null)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => (canalActivo ? setCanalActivo(null) : cerrar())}
    >
      <ScreenContainer>
        <View style={styles.banner}>
          <Ionicons name="eye-outline" size={16} color={colors.primary} />
          <Text style={styles.bannerText} numberOfLines={2}>
            Vista previa de <Text style={styles.bold}>{plantilla.nombre}</Text>. Navegá y decidí si
            querés crearlo.
          </Text>
        </View>

        {canalActivo ? (
          <View style={styles.flex}>
            <View style={styles.header}>
              <Pressable onPress={() => setCanalActivo(null)} hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color={colors.foreground} />
              </Pressable>
              <Ionicons
                name={iconByType[canalActivo.tipo] ?? 'chatbubble-outline'}
                size={18}
                color={colors.mutedForeground}
              />
              <Text style={styles.title} numberOfLines={1}>
                {canalActivo.nombre}
              </Text>
            </View>

            {canalActivo.tipo === 'voz' ? (
              <View style={styles.voiceBox}>
                <Ionicons name="volume-medium-outline" size={40} color={colors.mutedForeground} />
                <Text style={styles.welcomeTitle}>{canalActivo.nombre}</Text>
                <Text style={styles.welcomeText}>
                  Canal de voz. Cuando crees el servidor, vas a poder entrar a hablar acá.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.chatBody}>
                  <View style={styles.welcomeIcon}>
                    <Ionicons
                      name={iconByType[canalActivo.tipo] ?? 'chatbubble-outline'}
                      size={26}
                      color={colors.foreground}
                    />
                  </View>
                  <Text style={styles.welcomeTitle}>¡Te damos la bienvenida a #{canalActivo.nombre}!</Text>
                  <Text style={styles.welcomeText}>
                    {canalActivo.tipo === 'anuncios'
                      ? 'Canal de anuncios: ideal para novedades importantes del servidor.'
                      : canalActivo.tipo === 'codigo'
                        ? 'Canal de código: para compartir fragmentos con formato.'
                        : `Este es el comienzo del canal #${canalActivo.nombre}.`}
                  </Text>
                </View>
                <View style={styles.composer}>
                  <Ionicons name="lock-closed-outline" size={14} color={colors.mutedForeground} />
                  <Text style={styles.composerText}>No podés escribir en una vista previa.</Text>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.flex}>
            <View style={styles.header}>
              <Pressable onPress={cerrar} hitSlop={8} disabled={creating}>
                <Ionicons name="chevron-back" size={22} color={colors.foreground} />
              </Pressable>
              <Text style={styles.title} numberOfLines={1}>
                {nombre}
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
              {grupos.map((grupo, index) => (
                <View key={grupo.categoria ?? index}>
                  {grupo.categoria ? (
                    <Text style={styles.sectionTitle}>{grupo.categoria.toUpperCase()}</Text>
                  ) : null}
                  {grupo.canales.map((canal) => (
                    <Pressable
                      key={`${grupo.categoria ?? ''}-${canal.nombre}`}
                      style={({ pressed }) => [styles.channelRow, pressed && styles.channelRowPressed]}
                      onPress={() => setCanalActivo(canal)}
                    >
                      <Ionicons
                        name={iconByType[canal.tipo] ?? 'chatbubble-outline'}
                        size={18}
                        color={colors.mutedForeground}
                      />
                      <Text style={styles.channelName} numberOfLines={1}>
                        {canal.nombre}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
              {plantilla.canales.length === 0 ? (
                <Text style={styles.welcomeText}>Esta plantilla arranca sin canales.</Text>
              ) : null}

              {plantilla.roles.length > 0 ? (
                <View>
                  <Text style={styles.sectionTitle}>ROLES DE LA PLANTILLA</Text>
                  <View style={styles.roles}>
                    {plantilla.roles.map((rol) => (
                      <View key={rol.nombre} style={styles.roleChip}>
                        <Text style={styles.roleText}>{rol.nombre}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        )}

        <View style={styles.footer}>
          <Pressable style={styles.secondaryButton} onPress={cerrar} disabled={creating}>
            <Text style={styles.secondaryLabel}>Volver</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, creating && styles.disabled]}
            onPress={onCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.primaryLabel}>Crear este servidor</Text>
            )}
          </Pressable>
        </View>
      </ScreenContainer>
    </Modal>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700', color: colors.foreground },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: alfa(colors.primary, 0.15),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bannerText: { flex: 1, color: colors.foreground, fontSize: fontSize.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  list: { paddingBottom: spacing.xl },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  channelRowPressed: { backgroundColor: colors.secondary },
  channelName: { flex: 1, color: colors.foreground, fontSize: fontSize.md },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: spacing.lg },
  roleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  roleText: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '600' },
  chatBody: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.xs },
  welcomeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  welcomeTitle: { color: colors.foreground, fontSize: fontSize.xl, fontWeight: '700' },
  welcomeText: { color: colors.mutedForeground, fontSize: fontSize.sm, lineHeight: 19 },
  voiceBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  composerText: { color: colors.mutedForeground, fontSize: fontSize.sm },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryLabel: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '600' },
  primaryButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryLabel: { color: colors.primaryForeground, fontSize: fontSize.md, fontWeight: '600' },
  disabled: { opacity: 0.6 },
})

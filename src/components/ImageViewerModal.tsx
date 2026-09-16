import { useState } from 'react'
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'

import { spacing } from '@/theme/theme'

export function ImageViewerModal({
  uri,
  onClose,
}: {
  uri: string | null
  onClose: () => void
}) {
  const [rotation, setRotation] = useState(0)
  const { width, height } = Dimensions.get('window')

  return (
    <Modal
      visible={uri !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={() => setRotation(0)}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={4}
          minimumZoomScale={1}
          pinchGestureEnabled
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={onClose}>
            {uri ? (
              <Image
                source={{ uri }}
                style={[
                  { width, height: height * 0.8 },
                  { transform: [{ rotate: `${rotation}deg` }] },
                ]}
                contentFit="contain"
              />
            ) : null}
          </Pressable>
        </ScrollView>

        <View style={styles.toolbar}>
          <Pressable style={styles.toolBtn} onPress={() => setRotation((r) => r + 90)} hitSlop={8}>
            <Ionicons name="refresh-outline" size={22} color="#fff" />
          </Pressable>
          <Pressable style={styles.toolBtn} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

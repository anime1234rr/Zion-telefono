import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export const authStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  confirmationBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  confirmationText: {
    color: colors.foreground,
    fontSize: fontSize.sm,
  },
  bold: {
    fontWeight: '700',
  },
  form: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    fontSize: fontSize.md,
  },
  codeInput: {
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    fontSize: fontSize.xl,
    letterSpacing: 6,
    textAlign: 'center',
  },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: spacing.xxl,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.sm,
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    color: colors.primaryForeground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  switchModeText: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    textDecorationLine: 'underline',
  },
  linksRow: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
})

module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['/dist/*'],
  rules: {
    '@typescript-eslint/no-empty-object-type': 'off',
  },
  overrides: [
    {
      files: ['src/screens/servers/VoiceChannelScreen.tsx'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
}

const { withAndroidManifest, withAndroidStyles, AndroidConfig } = require('@expo/config-plugins')

function withForceDarkManifestFlag(config) {
  return withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults)
    application.$['android:forceDarkAllowed'] = 'false'
    return config
  })
}

function withForcedDarkTextTheme(config) {
  return withAndroidStyles(config, (config) => {
    const parent = AndroidConfig.Styles.getAppThemeGroup()
    const items = [
      ['android:textColorPrimary', '#FFFFFF'],
      ['android:textColorSecondary', '#9CA3AF'],
      ['android:textColorHint', '#9CA3AF'],
      ['android:textColorPrimaryInverse', '#0F1117'],
      ['android:colorControlActivated', '#6366F1'],
      ['android:colorControlNormal', '#9CA3AF'],
    ]
    for (const [name, value] of items) {
      config.modResults = AndroidConfig.Styles.setStylesItem({
        xml: config.modResults,
        parent,
        item: { $: { name }, _: value },
      })
    }
    return config
  })
}

module.exports = function withDisableForceDark(config) {
  config = withForceDarkManifestFlag(config)
  config = withForcedDarkTextTheme(config)
  return config
}

const {
  AndroidConfig,
  withAndroidManifest,
} = require('@expo/config-plugins');

function addCleartextTrafficToManifest(androidManifest) {
  const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  
  // Agregar usesCleartextTraffic
  mainApplication.$['android:usesCleartextTraffic'] = 'true';
  
  return androidManifest;
}

module.exports = function withCleartext(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addCleartextTrafficToManifest(config.modResults);
    return config;
  });
};

const { withAndroidSettingsGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Removes @react-native-async-storage/async-storage from the Android Gradle build entirely.
 * async-storage v3.x causes Kotlin classpath conflicts that are impossible to resolve
 * without this approach. Since we replaced all AsyncStorage usage with expo-file-system,
 * the native module is not needed.
 */
function withRemoveAsyncStorageFromSettings(config) {
  return withAndroidSettingsGradle(config, (config) => {
    const contents = config.modResults.contents;

    // Remove the async-storage project include from settings.gradle
    const cleaned = contents
      .replace(/\n?include ':react-native-async-storage_async-storage'[^\n]*/g, '')
      .replace(/\n?project\(':react-native-async-storage_async-storage'\)\.projectDir[^\n]*/g, '');

    config.modResults.contents = cleaned;
    console.log('[patch-async-storage] Removed async-storage from settings.gradle');
    return config;
  });
}

/**
 * Also removes async-storage implementation from app/build.gradle if present.
 */
function withRemoveAsyncStorageFromAppBuild(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const appBuildGradlePath = path.join(
        config.modRequest.projectRoot,
        'android',
        'app',
        'build.gradle'
      );

      if (!fs.existsSync(appBuildGradlePath)) {
        return config;
      }

      let content = fs.readFileSync(appBuildGradlePath, 'utf8');
      const cleaned = content.replace(
        /\n?\s*implementation project\(':react-native-async-storage_async-storage'\)[^\n]*/g,
        ''
      );

      if (cleaned !== content) {
        fs.writeFileSync(appBuildGradlePath, cleaned);
        console.log('[patch-async-storage] Removed async-storage from app/build.gradle');
      }

      return config;
    },
  ]);
}

module.exports = (config) => {
  config = withRemoveAsyncStorageFromSettings(config);
  config = withRemoveAsyncStorageFromAppBuild(config);
  return config;
};

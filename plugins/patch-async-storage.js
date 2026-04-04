const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Removes @react-native-async-storage/async-storage from the Android Gradle build.
 * async-storage v3.x causes Kotlin classpath conflicts. Since we replaced all
 * AsyncStorage usage with expo-file-system, the native module is not needed.
 */
module.exports = (config) =>
  withDangerousMod(config, [
    'android',
    (config) => {
      const androidDir = path.join(config.modRequest.projectRoot, 'android');

      // Patch settings.gradle
      const settingsGradlePath = path.join(androidDir, 'settings.gradle');
      if (fs.existsSync(settingsGradlePath)) {
        let content = fs.readFileSync(settingsGradlePath, 'utf8');
        const before = content;
        content = content
          .replace(/\n?include ':react-native-async-storage_async-storage'[^\n]*/g, '')
          .replace(/\n?project\(':react-native-async-storage_async-storage'\)\.projectDir[^\n]*/g, '');
        if (content !== before) {
          fs.writeFileSync(settingsGradlePath, content);
          console.log('[patch-async-storage] Removed async-storage from settings.gradle');
        }
      }

      // Patch app/build.gradle
      const appBuildGradlePath = path.join(androidDir, 'app', 'build.gradle');
      if (fs.existsSync(appBuildGradlePath)) {
        let content = fs.readFileSync(appBuildGradlePath, 'utf8');
        const before = content;
        content = content.replace(
          /\n?\s*implementation project\(':react-native-async-storage_async-storage'\)[^\n]*/g,
          ''
        );
        if (content !== before) {
          fs.writeFileSync(appBuildGradlePath, content);
          console.log('[patch-async-storage] Removed async-storage from app/build.gradle');
        }
      }

      return config;
    },
  ]);

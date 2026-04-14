const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * async-storage v3.x ships storage-android:1.0.0 inside android/local_repo/
 * but its build.gradle only declares mavenCentral() and google() — missing the
 * local repo. This patch adds it so Gradle can resolve the artifact.
 */
module.exports = (config) =>
  withDangerousMod(config, [
    'android',
    (config) => {
      const buildGradlePath = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        '@react-native-async-storage',
        'async-storage',
        'android',
        'build.gradle'
      );

      if (!fs.existsSync(buildGradlePath)) {
        return config;
      }

      let content = fs.readFileSync(buildGradlePath, 'utf8');

      if (!content.includes('local_repo')) {
        content = content.replace(
          /repositories\s*\{\s*\n\s*mavenCentral\(\)\s*\n\s*google\(\)\s*\n\s*\}/,
          `repositories {
    maven { url = uri(new File(project.projectDir, "local_repo").absolutePath) }
    mavenCentral()
    google()
}`
        );
        fs.writeFileSync(buildGradlePath, content);
        console.log('[patch-async-storage] Added local_repo to async-storage build.gradle');
      }

      return config;
    },
  ]);

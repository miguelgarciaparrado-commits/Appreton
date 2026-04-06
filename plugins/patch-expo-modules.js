const { withProjectBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Fix 1 (withProjectBuildGradle):
 *   Adds ext.compileSdkVersion / targetSdkVersion / minSdkVersion to the ROOT
 *   android/build.gradle so that expo-modules-core's safeExtGet() can read them
 *   via rootProject.ext.has("compileSdkVersion").
 *
 * Fix 2 (withDangerousMod):
 *   Patches ExpoModulesCorePlugin.gradle to avoid the AGP 8.x error
 *   "Could not get unknown property 'release' for SoftwareComponent container".
 *   Uses components.findByName("release") with a null-guard instead of the
 *   bare components.release property access.
 */
function withProjectExtVersions(config) {
  return withProjectBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    // Only add if not already present
    if (!contents.includes('ext.compileSdkVersion')) {
      // Insert after the first `allprojects {` block opening, or before `subprojects`
      // Safest: insert at the very end of the top-level `buildscript {}` block.
      // We add a standalone ext block right before `allprojects`.
      const insertBefore = /allprojects\s*\{/;
      const extBlock = `\next {\n    compileSdkVersion = 35\n    targetSdkVersion = 34\n    minSdkVersion = 24\n}\n\n`;
      if (insertBefore.test(contents)) {
        contents = contents.replace(insertBefore, (match) => extBlock + match);
      } else {
        // Fallback: append at end
        contents += extBlock;
      }
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

function withPatchedExpoModulesCore(config) {
  return withDangerousMod(config, [
    'android',
    (mod) => {
      const pluginPath = path.join(
        mod.modRequest.projectRoot,
        'node_modules',
        'expo-modules-core',
        'android',
        'ExpoModulesCorePlugin.gradle'
      );

      if (!fs.existsSync(pluginPath)) {
        return mod;
      }

      let content = fs.readFileSync(pluginPath, 'utf8');

      // Replace the problematic `from components.release` with a null-safe version.
      // AGP 8.x does not expose `components.release` as a dynamic property; use findByName() instead.
      if (content.includes('from components.release')) {
        const oldBlock = `  project.afterEvaluate {
    publishing {
      publications {
        release(MavenPublication) {
          from components.release
        }
      }
      repositories {
        maven {
          url = mavenLocal().url
        }
      }
    }
  }`;
        const newBlock = `  project.afterEvaluate {
    def releaseComponent = project.components.findByName("release")
    if (releaseComponent != null) {
      publishing {
        publications {
          release(MavenPublication) {
            from releaseComponent
          }
        }
        repositories {
          maven {
            url = mavenLocal().url
          }
        }
      }
    }
  }`;

        if (content.includes(oldBlock)) {
          content = content.replace(oldBlock, newBlock);
          console.log('[patch-expo-modules] Patched ExpoModulesCorePlugin.gradle (components.release)');
        } else {
          // Fallback: simple line replacement (may leave malformed braces if context changed)
          content = content.replace(
            '          from components.release',
            '          from project.components.findByName("release")'
          );
          console.log('[patch-expo-modules] Applied fallback components.release line patch');
        }

        fs.writeFileSync(pluginPath, content);
      }

      return mod;
    },
  ]);
}

module.exports = (config) => {
  config = withProjectExtVersions(config);
  config = withPatchedExpoModulesCore(config);
  return config;
};

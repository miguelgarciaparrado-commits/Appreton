const { withProjectBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Fix 1 (withProjectBuildGradle):
 *   Ensures top-level ext.compileSdkVersion / targetSdkVersion / minSdkVersion
 *   exist in android/build.gradle so rootProject.ext.has() returns true.
 *
 * Fix 2 (withDangerousMod – ExpoModulesCorePlugin.gradle):
 *   a) Patches useDefaultAndroidSdkVersions() to hardcode SDK 35/34/24, bypassing
 *      safeExtGet() lookup issues entirely.
 *   b) Patches `from components.release` (broken in AGP 8.x) to use findByName().
 */
function withProjectExtVersions(config) {
  return withProjectBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    // Ensure top-level ext properties exist (safeExtGet reads from rootProject.ext)
    if (!contents.includes('ext.compileSdkVersion = 35')) {
      const extLines = `\next.compileSdkVersion = 35\next.targetSdkVersion = 34\next.minSdkVersion = 24\next.ndkVersion = "27.1.12297006"\n\n`;
      // Insert before allprojects{} if present, otherwise append
      const insertBefore = /allprojects\s*\{/;
      if (insertBefore.test(contents)) {
        contents = contents.replace(insertBefore, (match) => extLines + match);
      } else if (contents.includes('apply plugin: "com.facebook.react.rootproject"')) {
        contents = contents.replace(
          'apply plugin: "com.facebook.react.rootproject"',
          extLines + 'apply plugin: "com.facebook.react.rootproject"'
        );
      } else {
        contents += extLines;
      }
      console.log('[patch-expo-modules] Added ext.compileSdkVersion + ndkVersion to android/build.gradle');
    } else if (!contents.includes('ext.ndkVersion')) {
      // Ya tenia compileSdkVersion pero no ndkVersion — inyectarlo justo despues
      contents = contents.replace(
        /ext\.compileSdkVersion\s*=\s*35/,
        'ext.compileSdkVersion = 35\next.ndkVersion = "27.1.12297006"'
      );
      console.log('[patch-expo-modules] Added ext.ndkVersion to android/build.gradle');
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
      let changed = false;

      // ── Patch 1: hardcode SDK versions in useDefaultAndroidSdkVersions ─────
      // safeExtGet has lookup issues with expo-build-properties' gradle.properties keys.
      // Hardcoding ensures compileSdkVersion is always set correctly.
      const oldSdkVersions = `ext.useDefaultAndroidSdkVersions = {
  project.android {
    compileSdkVersion project.ext.safeExtGet("compileSdkVersion", 34)

    defaultConfig {
      minSdkVersion project.ext.safeExtGet("minSdkVersion", 23)
      targetSdkVersion project.ext.safeExtGet("targetSdkVersion", 34)
    }

    lintOptions {
      abortOnError false
    }
  }
}`;
      const newSdkVersions = `ext.useDefaultAndroidSdkVersions = {
  def compileSdk = 35
  def minSdk = 24
  def targetSdk = 34
  // Try safeExtGet first; fall back to hardcoded values for expo-build-properties compat
  try {
    if (project.ext.has("safeExtGet")) {
      def v = project.ext.safeExtGet("compileSdkVersion", compileSdk)
      if (v != null) { compileSdk = v instanceof Integer ? v : v.toString().toInteger() }
      def m = project.ext.safeExtGet("minSdkVersion", minSdk)
      if (m != null) { minSdk = m instanceof Integer ? m : m.toString().toInteger() }
      def t = project.ext.safeExtGet("targetSdkVersion", targetSdk)
      if (t != null) { targetSdk = t instanceof Integer ? t : t.toString().toInteger() }
    }
  } catch (ignored) {}
  project.android {
    ndkVersion "27.1.12297006"
    compileSdkVersion compileSdk

    defaultConfig {
      minSdkVersion minSdk
      targetSdkVersion targetSdk
    }

    lintOptions {
      abortOnError false
    }
  }
}`;

      if (content.includes(oldSdkVersions)) {
        content = content.replace(oldSdkVersions, newSdkVersions);
        changed = true;
        console.log('[patch-expo-modules] Patched ExpoModulesCorePlugin.gradle (useDefaultAndroidSdkVersions)');
      } else if (content.includes('compileSdkVersion project.ext.safeExtGet("compileSdkVersion", 34)')) {
        // Fallback: just replace the single compileSdkVersion line
        content = content.replace(
          'compileSdkVersion project.ext.safeExtGet("compileSdkVersion", 34)',
          'compileSdkVersion 35'
        );
        content = content.replace(
          'minSdkVersion project.ext.safeExtGet("minSdkVersion", 23)',
          'minSdkVersion 24'
        );
        content = content.replace(
          'targetSdkVersion project.ext.safeExtGet("targetSdkVersion", 34)',
          'targetSdkVersion 34'
        );
        changed = true;
        console.log('[patch-expo-modules] Patched ExpoModulesCorePlugin.gradle (compileSdkVersion hardcode fallback)');
      }

      // ── Patch 2: components.release → findByName() for AGP 8.x ─────────────
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
        } else {
          content = content.replace(
            '          from components.release',
            '          from project.components.findByName("release")'
          );
        }
        changed = true;
        console.log('[patch-expo-modules] Patched ExpoModulesCorePlugin.gradle (components.release)');
      }

      if (changed) {
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

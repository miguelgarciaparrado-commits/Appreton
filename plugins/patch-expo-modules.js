const { withProjectBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Fix 1 (withProjectBuildGradle):
 *   Adds top-level ext { compileSdkVersion = 35 ... } to android/build.gradle
 *   so that safeExtGet() can find it via rootProject.ext.has().
 *
 * Fix 2 (withDangerousMod – ExpoModulesCorePlugin.gradle):
 *   a) Patches safeExtGet to fall back to rootProject.hasProperty() so values
 *      from gradle.properties are also accepted.
 *   b) Patches `from components.release` (broken in AGP 8.x) to use findByName().
 */
function withProjectExtVersions(config) {
  return withProjectBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    // Add standalone ext block at top level if not already there
    if (!contents.includes('ext.compileSdkVersion') && !contents.includes('compileSdkVersion = 35')) {
      const extBlock = `\next {\n    compileSdkVersion = 35\n    targetSdkVersion = 34\n    minSdkVersion = 24\n}\n\n`;
      const insertBefore = /allprojects\s*\{/;
      if (insertBefore.test(contents)) {
        contents = contents.replace(insertBefore, (match) => extBlock + match);
      } else {
        contents += extBlock;
      }
      console.log('[patch-expo-modules] Added ext versions to android/build.gradle');
    } else if (!contents.includes('ext.compileSdkVersion')) {
      // Already has compileSdkVersion = 35 somewhere (e.g. buildscript.ext from expo-build-properties)
      // Ensure it's also at the top-level ext so rootProject.ext.has() finds it
      const extBlock = `\next.compileSdkVersion = 35\next.targetSdkVersion = 34\next.minSdkVersion = 24\n\n`;
      const insertBefore = /allprojects\s*\{/;
      if (insertBefore.test(contents)) {
        contents = contents.replace(insertBefore, (match) => extBlock + match);
      } else {
        contents += extBlock;
      }
      console.log('[patch-expo-modules] Added ext.compileSdkVersion lines to android/build.gradle');
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

      // ── Patch 1: safeExtGet – also check rootProject.hasProperty() ──────────
      // gradle.properties values land in project.properties, not project.ext.
      // This lets compileSdkVersion=35 set in gradle.properties be found too.
      const oldSafeExtGet = `    project.ext.safeExtGet = { prop, fallback ->
      project.rootProject.ext.has(prop) ? project.rootProject.ext.get(prop) : fallback
    }`;
      const newSafeExtGet = `    project.ext.safeExtGet = { prop, fallback ->
      if (project.rootProject.ext.has(prop)) {
        return project.rootProject.ext.get(prop)
      }
      if (project.rootProject.hasProperty(prop)) {
        def val = project.rootProject.properties[prop]
        try { return val instanceof Integer ? val : Integer.parseInt(val.toString()) } catch (e) { return val }
      }
      return fallback
    }`;

      if (content.includes(oldSafeExtGet)) {
        content = content.replace(oldSafeExtGet, newSafeExtGet);
        changed = true;
        console.log('[patch-expo-modules] Patched ExpoModulesCorePlugin.gradle (safeExtGet)');
      }

      // ── Patch 2: components.release → findByName() for AGP 8.x ─────────────
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

      if (content.includes('from components.release')) {
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

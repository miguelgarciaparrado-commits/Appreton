/**
 * Aplica los parches necesarios a expo-modules-core antes de compilar con Gradle.
 * Ejecutar desde C:\Users\PC\Appreton con: node apply-patches.js
 */
const fs = require('fs');
const path = require('path');

const pluginPath = path.join(__dirname, 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');

if (!fs.existsSync(pluginPath)) {
  console.error('ERROR: No se encontro ExpoModulesCorePlugin.gradle en:', pluginPath);
  process.exit(1);
}

let content = fs.readFileSync(pluginPath, 'utf8');
let changed = false;

// ── Parche 1: useDefaultAndroidSdkVersions ─────────────────────────────────
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
  project.android {
    compileSdkVersion 35

    defaultConfig {
      minSdkVersion 24
      targetSdkVersion 34
    }

    lintOptions {
      abortOnError false
    }
  }
}`;

if (content.includes(oldSdkVersions)) {
  content = content.replace(oldSdkVersions, newSdkVersions);
  changed = true;
  console.log('[OK] Parcheado useDefaultAndroidSdkVersions (compileSdkVersion 35)');
} else if (content.includes('compileSdkVersion project.ext.safeExtGet("compileSdkVersion", 34)')) {
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
  console.log('[OK] Parcheado compileSdkVersion (modo fallback)');
} else {
  console.log('[--] useDefaultAndroidSdkVersions ya estaba parcheado o no se encontro');
}

// ── Parche 2: components.release → findByName() ────────────────────────────
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
  console.log('[OK] Parcheado components.release → findByName()');
} else {
  console.log('[--] components.release ya estaba parcheado o no se encontro');
}

if (changed) {
  fs.writeFileSync(pluginPath, content);
  console.log('\nParches aplicados correctamente. Ahora ejecuta:');
  console.log('  cd android');
  console.log('  .\\gradlew assembleDebug');
} else {
  console.log('\nNo hubo cambios. El archivo ya estaba parcheado.');
}

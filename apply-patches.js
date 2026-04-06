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

// Leer y normalizar line endings (Windows usa \r\n, el script usa \n)
let content = fs.readFileSync(pluginPath, 'utf8').replace(/\r\n/g, '\n');
let changed = false;

// ── Diagnóstico: mostrar estado actual ────────────────────────────────────
const idx = content.indexOf('useDefaultAndroidSdkVersions');
if (idx >= 0) {
  console.log('=== Estado actual de useDefaultAndroidSdkVersions ===');
  console.log(content.substring(idx, idx + 350));
  console.log('=====================================================\n');
} else {
  console.log('WARN: useDefaultAndroidSdkVersions NO encontrado en el archivo!');
}

// ── Parche 1: reemplazar useDefaultAndroidSdkVersions completo ────────────
// Usamos una regex flexible para manejar variaciones de whitespace
const sdkVersionsRegex = /ext\.useDefaultAndroidSdkVersions\s*=\s*\{[\s\S]*?project\.android\s*\{[\s\S]*?compileSdkVersion[\s\S]*?lintOptions\s*\{[\s\S]*?abortOnError false[\s\S]*?\}[\s\S]*?\}\s*\}/;

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

if (content.includes('compileSdkVersion 35') && content.includes('minSdkVersion 24')) {
  console.log('[--] useDefaultAndroidSdkVersions ya tiene los valores hardcodeados (35/24/34)');
} else if (sdkVersionsRegex.test(content)) {
  content = content.replace(sdkVersionsRegex, newSdkVersions);
  changed = true;
  console.log('[OK] Parcheado useDefaultAndroidSdkVersions (compileSdkVersion 35)');
} else {
  // Fallback: reemplazar solo la línea de compileSdkVersion
  if (content.includes('compileSdkVersion project.ext.safeExtGet')) {
    content = content
      .replace(/compileSdkVersion project\.ext\.safeExtGet\("compileSdkVersion",\s*\d+\)/, 'compileSdkVersion 35')
      .replace(/minSdkVersion project\.ext\.safeExtGet\("minSdkVersion",\s*\d+\)/, 'minSdkVersion 24')
      .replace(/targetSdkVersion project\.ext\.safeExtGet\("targetSdkVersion",\s*\d+\)/, 'targetSdkVersion 34');
    changed = true;
    console.log('[OK] Parcheado compileSdkVersion (modo regex linea)');
  } else {
    console.log('[WARN] No se pudo parchear useDefaultAndroidSdkVersions - estado desconocido');
  }
}

// ── Parche 2: components.release → findByName() ────────────────────────────
if (content.includes('from components.release')) {
  content = content.replace(
    /project\.afterEvaluate\s*\{[\s\S]*?from components\.release[\s\S]*?\}\s*\}\s*\}\s*\}/,
    `project.afterEvaluate {
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
  }`
  );
  changed = true;
  console.log('[OK] Parcheado components.release → findByName()');
} else {
  console.log('[--] components.release ya estaba parcheado');
}

if (changed) {
  // Escribir con line endings Unix (\n) para Gradle en Windows
  fs.writeFileSync(pluginPath, content);
  console.log('\nParches aplicados. Ejecuta:');
  console.log('  cd android');
  console.log('  .\\gradlew assembleDebug');
} else {
  console.log('\nArchivo ya parcheado. Ejecuta:');
  console.log('  cd android');
  console.log('  .\\gradlew assembleDebug');
}

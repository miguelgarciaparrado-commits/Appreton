/**
 * Diagnóstico y parches definitivos
 * Ejecutar desde la raíz del proyecto con: node apply-patches.js
 *
 * TODOS los parches de este script son específicos para Android.
 * En iOS / macOS los archivos a parchear no existen, así que el script
 * termina sin hacer nada (no rompe el build iOS).
 */
const fs = require('fs');
const path = require('path');

// ── Parche 1: ExpoModulesCorePlugin.gradle ────────────────────────────────
const pluginPath = path.join(__dirname, 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');

if (!fs.existsSync(pluginPath)) {
  console.log('[--] node_modules/expo-modules-core/android no existe (build iOS o dependencias no instaladas). Nada que parchear.');
  process.exit(0);
}

let content = fs.readFileSync(pluginPath, 'utf8').replace(/\r\n/g, '\n');

// Asegurarse de que compileSdkVersion 35 está hardcodeado
if (!content.includes('compileSdkVersion 35')) {
  content = content
    .replace(/compileSdkVersion project\.ext\.safeExtGet\("compileSdkVersion",\s*\d+\)/, 'compileSdkVersion 35')
    .replace(/minSdkVersion project\.ext\.safeExtGet\("minSdkVersion",\s*\d+\)/, 'minSdkVersion 24')
    .replace(/targetSdkVersion project\.ext\.safeExtGet\("targetSdkVersion",\s*\d+\)/, 'targetSdkVersion 34');
  console.log('[OK] ExpoModulesCorePlugin.gradle - SDK versions hardcodeados');
} else {
  console.log('[--] ExpoModulesCorePlugin.gradle - ya tiene compileSdkVersion 35');
}

// Inyectar ndkVersion en el project.android del helper useDefaultAndroidSdkVersions.
// Todos los modulos expo pasan por aqui, asi que con una sola linea sobrescriben
// el default del Android Gradle Plugin (26.1.10909125) que da problemas de
// licencia. Usamos la 27 que ya esta instalada.
if (!content.includes('ndkVersion "27.1.12297006"')) {
  const beforeCompileSdk = /project\.android\s*\{\s*\n(\s*)compileSdkVersion/;
  if (beforeCompileSdk.test(content)) {
    content = content.replace(beforeCompileSdk, (m, indent) => {
      return `project.android {\n${indent}ndkVersion "27.1.12297006"\n${indent}compileSdkVersion`;
    });
    console.log('[OK] ExpoModulesCorePlugin.gradle - ndkVersion 27.1.12297006 inyectado');
  } else {
    console.log('[WARN] ExpoModulesCorePlugin.gradle - no se encontro project.android { compileSdkVersion, ndkVersion no inyectado');
  }
} else {
  console.log('[--] ExpoModulesCorePlugin.gradle - ya tiene ndkVersion 27');
}

// Asegurarse de que components.release está parcheado
if (content.includes('from components.release')) {
  content = content.replace('from components.release', 'from project.components.findByName("release")');
  console.log('[OK] ExpoModulesCorePlugin.gradle - components.release parcheado');
}

// Wrap applyKotlinExpoModulesCorePlugin con try-catch completo
const oldApply = `ext.applyKotlinExpoModulesCorePlugin = {
  try {
    // Tries to apply the kotlin-android plugin if the client project does not apply yet.
    // On previous \`applyKotlinExpoModulesCorePlugin\`, it is inside the \`project.buildscript\` block.
    // We cannot use \`project.plugins.hasPlugin()\` yet but only to try-catch instead.
    apply plugin: 'kotlin-android'
  } catch (e) {}

  apply plugin: KotlinExpoModulesCorePlugin
}`;
const newApply = `ext.applyKotlinExpoModulesCorePlugin = {
  try {
    apply plugin: 'kotlin-android'
  } catch (e) {}

  try {
    apply plugin: KotlinExpoModulesCorePlugin
  } catch (e) {
    println ">>> EXPO_PATCH_ERROR en applyKotlinExpoModulesCorePlugin para \${project.name}: \${e.message}"
  }
}`;

if (content.includes(oldApply)) {
  content = content.replace(oldApply, newApply);
  console.log('[OK] applyKotlinExpoModulesCorePlugin - añadido try-catch completo');
} else if (!content.includes('EXPO_PATCH_ERROR')) {
  // Fallback: reemplazar la línea problemática
  content = content.replace(
    `  apply plugin: KotlinExpoModulesCorePlugin\n}`,
    `  try {\n    apply plugin: KotlinExpoModulesCorePlugin\n  } catch (e) {\n    println ">>> EXPO_PATCH_ERROR: \${e.message}"\n  }\n}`
  );
  console.log('[OK] applyKotlinExpoModulesCorePlugin - try-catch fallback añadido');
}

fs.writeFileSync(pluginPath, content);

// ── Parche 2: expo-font/android/build.gradle ─────────────────────────────
// Reemplazar completamente las llamadas a funciones expo con implementación directa
// porque applyKotlinExpoModulesCorePlugin() falla silenciosamente para expo-font
const expoFontPath = path.join(__dirname, 'node_modules', 'expo-font', 'android', 'build.gradle');
if (!fs.existsSync(expoFontPath)) {
  console.log('[--] node_modules/expo-font/android no existe, saltando parche expo-font');
} else {
  const fontContent = fs.readFileSync(expoFontPath, 'utf8').replace(/\r\n/g, '\n');

  if (!fontContent.includes('EXPO_FONT_PATCHED')) {
    const newFontContent = `// EXPO_FONT_PATCHED
apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'

group = 'host.exp.exponent'
version = '13.0.4'

def expoModulesCorePlugin = new File(project(":expo-modules-core").projectDir.absolutePath, "ExpoModulesCorePlugin.gradle")
apply from: expoModulesCorePlugin

android {
  compileSdkVersion 35
  namespace "expo.modules.font"
  defaultConfig {
    minSdkVersion 24
    targetSdkVersion 34
    versionCode 29
    versionName "13.0.4"
  }
  lintOptions {
    abortOnError false
  }
}

dependencies {
  implementation project(':expo-modules-core')
  implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.25"
  implementation 'com.facebook.react:react-android'
}
`;
    fs.writeFileSync(expoFontPath, newFontContent);
    console.log('[OK] expo-font/android/build.gradle - reemplazado con configuración directa');
  } else {
    console.log('[--] expo-font/android/build.gradle - ya parcheado');
  }
}

console.log('\nEjecuta:');
console.log('  cd android');
console.log('  .\\gradlew assembleDebug 2>&1 | findstr /i "EXPO_PATCH error failure compileSdk"');

// ── Parche 3: NDK 26.1.10909125 → 27.1.12297006 ──────────────────────────
// expo-modules-autolinking y otros modulos expo exigen NDK 26, cuya licencia
// da problemas. La 27 ya la tenemos instalada. Sustituimos en cualquier
// .gradle de node_modules/expo-* / react-native* que mencione la 26.
const OLD_NDK = '26.1.10909125';
const NEW_NDK = '27.1.12297006';
let ndkReplaced = 0;

function walkAndPatch(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Evita ir a node_modules anidados para no tardar mucho
      if (e.name === 'node_modules') continue;
      walkAndPatch(full);
    } else if (e.isFile() && (e.name.endsWith('.gradle') || e.name.endsWith('.gradle.kts'))) {
      try {
        const c = fs.readFileSync(full, 'utf8');
        if (c.includes(OLD_NDK)) {
          fs.writeFileSync(full, c.split(OLD_NDK).join(NEW_NDK));
          console.log('[OK] NDK reemplazado en ' + path.relative(__dirname, full));
          ndkReplaced++;
        }
      } catch {}
    }
  }
}

for (const pkg of ['expo-modules-autolinking', 'expo-modules-core', 'expo', 'react-native', 'expo-build-properties']) {
  walkAndPatch(path.join(__dirname, 'node_modules', pkg));
}

console.log(`[NDK] ${ndkReplaced} archivos .gradle modificados (${OLD_NDK} -> ${NEW_NDK})`);

// ── Parche 4: inyectar ext.ndkVersion en android/build.gradle (root) ─────
// expo-modules-core lee rootProject.ext.ndkVersion si esta definido.
// Definiendolo aqui lo heredan todos los modulos expo automaticamente.
const rootGradlePath = path.join(__dirname, 'android', 'build.gradle');
if (fs.existsSync(rootGradlePath)) {
  let rootGradle = fs.readFileSync(rootGradlePath, 'utf8');
  if (rootGradle.includes('ext.ndkVersion = "27.1.12297006"')) {
    console.log('[--] android/build.gradle - ya tiene ext.ndkVersion 27');
  } else if (/ext\.compileSdkVersion\s*=\s*35/.test(rootGradle)) {
    rootGradle = rootGradle.replace(
      /ext\.compileSdkVersion\s*=\s*35/,
      'ext.compileSdkVersion = 35\next.ndkVersion = "27.1.12297006"'
    );
    fs.writeFileSync(rootGradlePath, rootGradle);
    console.log('[OK] android/build.gradle - ext.ndkVersion 27 inyectado tras ext.compileSdkVersion');
  } else {
    // Fallback: aniadir al final del archivo
    rootGradle += '\next.ndkVersion = "27.1.12297006"\n';
    fs.writeFileSync(rootGradlePath, rootGradle);
    console.log('[OK] android/build.gradle - ext.ndkVersion 27 aniadido al final');
  }
} else {
  console.log('[WARN] android/build.gradle no existe aun (ejecuta despues de prebuild)');
}

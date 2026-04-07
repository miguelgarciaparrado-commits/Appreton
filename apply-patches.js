/**
 * Diagnóstico y parches definitivos
 * Ejecutar desde C:\Users\PC\Appreton con: node apply-patches.js
 */
const fs = require('fs');
const path = require('path');

// ── Parche 1: ExpoModulesCorePlugin.gradle ────────────────────────────────
const pluginPath = path.join(__dirname, 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');
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
// Añadir compileSdkVersion 35 directamente al android{} block de expo-font
const expoFontPath = path.join(__dirname, 'node_modules', 'expo-font', 'android', 'build.gradle');
let fontContent = fs.readFileSync(expoFontPath, 'utf8').replace(/\r\n/g, '\n');

if (!fontContent.includes('compileSdkVersion 35')) {
  fontContent = fontContent.replace(
    'android {\n  namespace "expo.modules.font"',
    'android {\n  compileSdkVersion 35\n  namespace "expo.modules.font"'
  );
  fs.writeFileSync(expoFontPath, fontContent);
  console.log('[OK] expo-font/android/build.gradle - añadido compileSdkVersion 35');
} else {
  console.log('[--] expo-font/android/build.gradle - ya tiene compileSdkVersion 35');
}

console.log('\nEjecuta:');
console.log('  cd android');
console.log('  .\\gradlew assembleDebug 2>&1 | findstr /i "EXPO_PATCH error failure compileSdk"');

/**
 * Aplica parches + añade println de diagnóstico en useDefaultAndroidSdkVersions
 * Ejecutar desde C:\Users\PC\Appreton con: node apply-patches.js
 */
const fs = require('fs');
const path = require('path');

const pluginPath = path.join(__dirname, 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');

if (!fs.existsSync(pluginPath)) {
  console.error('ERROR: No se encontro:', pluginPath);
  process.exit(1);
}

let content = fs.readFileSync(pluginPath, 'utf8').replace(/\r\n/g, '\n');

// Reemplazar useDefaultAndroidSdkVersions con versión que incluye println
const target = `ext.useDefaultAndroidSdkVersions = {
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

const patched = `ext.useDefaultAndroidSdkVersions = {
  println ">>> EXPO_PATCH_ACTIVE: configurando compileSdkVersion 35 para \${project.name}"
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

if (content.includes(target)) {
  content = content.replace(target, patched);
  fs.writeFileSync(pluginPath, content);
  console.log('[OK] Añadido println de diagnóstico');
} else if (content.includes('compileSdkVersion 35') && !content.includes('EXPO_PATCH_ACTIVE')) {
  // Ya tiene compileSdkVersion 35 pero diferente formato, añadir println igualmente
  content = content.replace(
    /ext\.useDefaultAndroidSdkVersions\s*=\s*\{/,
    'ext.useDefaultAndroidSdkVersions = {\n  println ">>> EXPO_PATCH_ACTIVE: configurando compileSdkVersion 35 para ${project.name}"'
  );
  fs.writeFileSync(pluginPath, content);
  console.log('[OK] Añadido println (modo fallback)');
} else if (content.includes('EXPO_PATCH_ACTIVE')) {
  console.log('[--] println ya estaba añadido');
} else {
  console.log('[WARN] No se pudo añadir println - estructura desconocida');
}

console.log('\nEjecuta el build con:');
console.log('  cd android');
console.log('  .\\gradlew assembleDebug 2>&1 | findstr /i "EXPO_PATCH_ACTIVE\\|compileSdk\\|expo-font\\|error\\|failure"');

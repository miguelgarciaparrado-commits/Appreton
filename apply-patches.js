/**
 * Diagnóstico y parche para ExpoModulesCorePlugin.gradle
 * Ejecutar desde C:\Users\PC\Appreton con: node apply-patches.js
 */
const fs = require('fs');
const path = require('path');

const pluginPath = path.join(__dirname, 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');

if (!fs.existsSync(pluginPath)) {
  console.error('ERROR: No se encontro:', pluginPath);
  process.exit(1);
}

let content = fs.readFileSync(pluginPath, 'utf8');

// Mostrar TODO el archivo para diagnóstico
console.log('=== CONTENIDO COMPLETO DE ExpoModulesCorePlugin.gradle ===');
console.log(content);
console.log('=== FIN ===');
console.log('\nRuta del archivo:', pluginPath);
console.log('Tiene compileSdkVersion 35:', content.includes('compileSdkVersion 35'));
console.log('Tiene from components.release:', content.includes('from components.release'));
console.log('Tiene findByName:', content.includes('findByName'));

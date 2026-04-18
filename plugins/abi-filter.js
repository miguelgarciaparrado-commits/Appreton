// Limita los ABIs compilados a solo arm64-v8a para reducir
// drasticamente el tiempo de build. Para tu movil y el 95% de
// moviles modernos esto es suficiente.
//
// Si en el futuro quieres soportar moviles 32-bit o emuladores
// x86, añade mas ABIs al filter o elimina este plugin.

const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = (config) =>
  withAppBuildGradle(config, (props) => {
    let gradle = props.modResults.contents;

    if (gradle.includes('// APPRETON_ABI_FILTER')) return props;

    const abiBlock = `
        // APPRETON_ABI_FILTER: solo arm64-v8a (build mas rapido)
        ndk {
            abiFilters "arm64-v8a"
        }
`;

    // Inyecta dentro del defaultConfig
    gradle = gradle.replace(
      /defaultConfig\s*\{/,
      `defaultConfig {${abiBlock}`,
    );

    props.modResults.contents = gradle;
    return props;
  });

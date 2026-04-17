const { withAppBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = (config) =>
  withAppBuildGradle(config, (props) => {
    let gradle = props.modResults.contents;

    if (gradle.includes('signingConfigs.release')) return props;

    const keystoreBlock = `
def keystorePropertiesFile = rootProject.file("keystore.properties")
if (keystorePropertiesFile.exists()) {
    def keystoreProperties = new Properties()
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

    android.signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    android.buildTypes.release.signingConfig = android.signingConfigs.release
}
`;

    gradle = gradle.replace(
      /android\s*\{/,
      `${keystoreBlock}\nandroid {`,
    );

    props.modResults.contents = gradle;
    return props;
  });

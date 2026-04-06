const { withGradleProperties } = require('@expo/config-plugins');

module.exports = (config) =>
  withGradleProperties(config, (props) => {
    const remove = (key) => {
      props.modResults = props.modResults.filter(
        (item) => !(item.type === 'property' && item.key === key)
      );
    };
    const set = (key, value) => { remove(key); props.modResults.push({ type: 'property', key, value }); };

    // Remove linux-only path (invalid on Windows local builds)
    remove('org.gradle.java.home');

    // Limit JVM memory to avoid Gradle Worker Daemon crashes
    set('org.gradle.jvmargs', '-Xmx1536m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8');

    // async-storage v3 with Kotlin 1.9.25 needs a compatible KSP version.
    // Without this, it falls back to ksp 2.1.0-1.0.28 which conflicts with Kotlin 1.9.25.
    set('AsyncStorage_kspVersion', '1.9.25-1.0.20');

    return props;
  });

const { withGradleProperties } = require('@expo/config-plugins');

module.exports = (config) =>
  withGradleProperties(config, (props) => {
    const remove = (key) => {
      props.modResults = props.modResults.filter(
        (item) => !(item.type === 'property' && item.key === key)
      );
    };
    const set = (key, value) => { remove(key); props.modResults.push({ type: 'property', key, value }); };

    // Remove any linux-only java.home (invalid on Windows local builds)
    remove('org.gradle.java.home');

    // Limit JVM memory to avoid Gradle Worker Daemon crashes
    set('org.gradle.jvmargs', '-Xmx1536m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8');

    return props;
  });

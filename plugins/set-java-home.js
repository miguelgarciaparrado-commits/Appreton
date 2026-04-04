const { withGradleProperties } = require('@expo/config-plugins');

module.exports = (config) =>
  withGradleProperties(config, (props) => {
    const remove = (key) => {
      props.modResults = props.modResults.filter(
        (item) => !(item.type === 'property' && item.key === key)
      );
    };
    const set = (key, value) => { remove(key); props.modResults.push({ type: 'property', key, value }); };

    // JDK 17 for EAS build servers
    set('org.gradle.java.home', '/usr/lib/jvm/java-17-openjdk-amd64');

    // Limit JVM memory to avoid Gradle Worker Daemon crashes
    set('org.gradle.jvmargs', '-Xmx1536m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8');

    return props;
  });

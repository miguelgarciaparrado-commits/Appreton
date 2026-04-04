const { withGradleProperties } = require('@expo/config-plugins');

// Forces Gradle to use JDK 17 on EAS build servers (ubuntu-22.04-jdk-17 images)
module.exports = (config) =>
  withGradleProperties(config, (props) => {
    // Remove any existing java.home entry
    props.modResults = props.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'org.gradle.java.home')
    );
    props.modResults.push({
      type: 'property',
      key: 'org.gradle.java.home',
      value: '/usr/lib/jvm/java-17-openjdk-amd64',
    });
    // Tell async-storage v3.x to use Kotlin 1.9.25 (same as rootProject) to avoid classpath conflict
    props.modResults = props.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'AsyncStorage_kotlinVersion')
    );
    props.modResults.push({
      type: 'property',
      key: 'AsyncStorage_kotlinVersion',
      value: '1.9.25',
    });
    // Override KSP version to one compatible with Kotlin 1.9.25
    props.modResults = props.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'AsyncStorage_kspVersion')
    );
    props.modResults.push({
      type: 'property',
      key: 'AsyncStorage_kspVersion',
      value: '1.9.25-1.0.20',
    });
    return props;
  });

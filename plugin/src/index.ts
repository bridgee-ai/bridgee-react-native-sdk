import { ConfigPlugin, withProjectBuildGradle } from '@expo/config-plugins';

const MIN_SDK_VERSION = 21;

const withBridgeeMinSdk: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (cfg) => {
    const current = cfg.modResults.contents;
    const match = current.match(/minSdkVersion\s*=\s*(\d+)/);
    if (match) {
      const existing = parseInt(match[1] as string, 10);
      if (existing < MIN_SDK_VERSION) {
        cfg.modResults.contents = current.replace(
          /minSdkVersion\s*=\s*\d+/,
          `minSdkVersion = ${MIN_SDK_VERSION}`,
        );
      }
    }
    return cfg;
  });
};

const withBridgee: ConfigPlugin = (config) => {
  config = withBridgeeMinSdk(config);
  return config;
};

export default withBridgee;
module.exports = withBridgee;

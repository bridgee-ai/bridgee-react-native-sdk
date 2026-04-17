module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: 'import ai.bridgee.reactnative.BridgeeSdkPackage;',
        packageInstance: 'new BridgeeSdkPackage()',
      },
      ios: {},
    },
  },
};

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../package.json');
const config = require('../react-native.config');
test('published files preserve explicit native autolinking configuration', () => {
  assert.ok(manifest.files.includes('react-native.config.js'));
  assert.equal(config.dependency.platforms.android.packageImportPath, 'import ai.bridgee.reactnative.BridgeeSdkPackage;');
  assert.equal(config.dependency.platforms.android.packageInstance, 'new BridgeeSdkPackage()');
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../package.json');
const config = require('../react-native.config');
test('published files preserve explicit native autolinking configuration', () => {
  for (const file of ['react-native.config.js', 'docs/FIRST_OPEN_MIGRATION.md', 'docs/NATIVE_PINS_AFTER_PUBLICATION.md', 'patches/native-pins-after-publication.patch', 'RELEASE_CANDIDATE.md']) {
    assert.ok(manifest.files.includes(file), `${file} must ship with the package`);
  }
  assert.equal(config.dependency.platforms.android.packageImportPath, 'import ai.bridgee.reactnative.BridgeeSdkPackage;');
  assert.equal(config.dependency.platforms.android.packageInstance, 'new BridgeeSdkPackage()');
});

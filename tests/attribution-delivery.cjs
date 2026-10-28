const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('native first_open is suppressed while campaign delivery and callbacks are preserved', async () => {
  const listeners = new Map();
  const events = [];
  const properties = [];
  const result = { utm_source: 'TikTok', utm_medium: 'paid_social', utm_campaign: 'Launch+Summer' };
  const native = {
    configure: async () => {},
    firstOpen: async () => {
      for (const name of ['first_open', 'tenant_test_first_open', 'tenant_test_campaign_details', 'campaign_details']) {
        listeners.get('BridgeeAnalytics.logEvent')({ name, params: result });
      }
      listeners.get('BridgeeAnalytics.setUserProperty')({ name: 'install_source', value: 'TikTok' });
      return result;
    },
  };
  class Emitter {
    addListener(name, fn) {
      listeners.set(name, fn);
      return { remove: () => listeners.delete(name) };
    }
  }
  const source = fs.readFileSync('src/BridgeeSDK.ts', 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, global: {}, require(name) {
      assert.equal(name, 'react-native');
      return { NativeEventEmitter: Emitter, NativeModules: { BridgeeSdk: native }, Platform: { select: () => '' } };
    },
  });
  const sdk = exports.BridgeeSDK;
  await sdk.configure({ tenantId: 'tenant-test', tenantKey: 'test-only', provider: {
    logEvent: (name, params) => events.push({ name, params }),
    setUserProperty: (name, value) => properties.push({ name, value }),
  } });
  await assert.rejects(sdk.firstOpenWithConsent({ toJSON: () => ({}) }, { consentGranted: false, preserveNativeGoogleAttribution: false }), /attribution_consent_required/);
  const preserved = await sdk.firstOpenWithConsent({ toJSON: () => ({}) }, { consentGranted: true, preserveNativeGoogleAttribution: true });
  assert.equal(preserved.utm_source, '');
  assert.equal(events.length, 0);
  assert.equal(properties.length, 0);
  assert.equal(await sdk.firstOpenWithConsent({ toJSON: () => ({}) }, { consentGranted: true, preserveNativeGoogleAttribution: false }), result);
  assert.deepEqual(events.map(event => event.name), ['tenant_test_campaign_details', 'campaign_details']);
  assert.equal(events[1].params.utm_campaign, 'Launch+Summer');
  assert.deepEqual(properties, [{ name: 'install_source', value: 'TikTok' }]);
});

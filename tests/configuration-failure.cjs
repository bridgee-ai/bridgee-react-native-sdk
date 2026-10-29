const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('failed native configuration removes listeners and blocks firstOpen until a successful retry', async () => {
  const listeners = new Map();
  const events = [];
  let fail = true;
  let matchCalls = 0;
  const native = {
    configure: async () => { if (fail) throw new Error('native_setup_failed'); },
    firstOpen: async () => { matchCalls++; return { utm_source: '', utm_medium: '', utm_campaign: '' }; },
  };
  class Emitter {
    addListener(name, fn) {
      listeners.set(name, fn);
      return { remove: () => listeners.delete(name) };
    }
  }
  const { outputText } = ts.transpileModule(fs.readFileSync('src/BridgeeSDK.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, require(name) {
      assert.equal(name, 'react-native');
      return { NativeEventEmitter: Emitter, NativeModules: { BridgeeSdk: native }, Platform: { select: () => '' } };
    },
  });
  const sdk = exports.BridgeeSDK;
  const options = { tenantId: 'test-tenant', tenantKey: 'fixture-only', provider: {
    logEvent: (name) => events.push(name), setUserProperty: () => {},
  } };
  await assert.rejects(sdk.configure(options), /native_setup_failed/);
  assert.equal(listeners.size, 0);
  await assert.rejects(sdk.firstOpen({ toJSON: () => ({}) }), /before configure/);
  assert.equal(matchCalls, 0);
  fail = false;
  await sdk.configure(options);
  assert.equal(listeners.size, 2);
  await sdk.firstOpen({ toJSON: () => ({}) });
  assert.equal(matchCalls, 1);
  listeners.get('BridgeeAnalytics.logEvent')({ name: 'campaign_details', params: {} });
  assert.deepEqual(events, ['campaign_details']);
  fail = true;
  await assert.rejects(sdk.configure(options), /native_setup_failed/);
  assert.equal(listeners.size, 0);
  await assert.rejects(sdk.firstOpen({ toJSON: () => ({}) }), /before configure/);
  assert.equal(matchCalls, 1);
});

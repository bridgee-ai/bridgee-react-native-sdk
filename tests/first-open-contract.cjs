// No native calls, HTTP requests, Firebase events or customer data.
// Default: current TypeScript source. Optional: compare an unpacked published npm artifact.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const legacy = process.env.BRIDGEE_LEGACY_SDK;
const root = process.env.BRIDGEE_SDK_ROOT || process.cwd();
const plain = value => JSON.parse(JSON.stringify(value));
const utm = { utm_source: 'Synthetic+Source', utm_medium: 'paid_social', utm_campaign: 'Ação+%&Summer' };
const params = { ...utm, source: utm.utm_source, medium: utm.utm_medium, campaign: utm.utm_campaign };
const nativeEvents = ['fixture_tenant_first_open', 'fixture_tenant_campaign_details', 'first_open', 'campaign_details'];
function harness({ failure, throwingProvider = false, empty = false, dryRun = false } = {}) {
  const listeners = new Map(), events = [], properties = [], requests = [], configurations = [];
  const result = empty ? { utm_source: '', utm_medium: '', utm_campaign: '' } : utm;
  const native = {
    configure: async (...args) => { configurations.push(args); },
    firstOpen: async payload => {
      requests.push(plain(payload));
      if (failure) throw failure;
      if (!dryRun && !empty) {
        for (const name of nativeEvents) listeners.get('BridgeeAnalytics.logEvent')({ name, params });
        for (const key of ['source', 'medium', 'campaign']) listeners.get('BridgeeAnalytics.setUserProperty')({ name: `install_${key}`, value: utm[`utm_${key}`] });
      }
      return result;
    },
  };
  class NativeEventEmitter {
    addListener(name, fn) { listeners.set(name, fn); return { remove: () => listeners.delete(name) }; }
  }
  function load(name) {
    const exports = {};
    const source = legacy ? fs.readFileSync(path.join(legacy, 'lib/commonjs', `${name}.js`), 'utf8') :
      require(require.resolve('typescript', { paths: [root] })).transpileModule(fs.readFileSync(path.join(root, 'src', `${name}.ts`), 'utf8'), {
        compilerOptions: { module: 1, target: 7 },
      }).outputText;
    vm.runInNewContext(source, { exports, global: {}, URL, AbortController, setTimeout, clearTimeout,
      require(name) { assert.equal(name, 'react-native'); return { NativeEventEmitter, NativeModules: { BridgeeSdk: native }, Platform: { OS: 'android', select: () => '' } }; },
    });
    return exports;
  }
  const sdk = load('BridgeeSDK').BridgeeSDK;
  const bundle = new (load('MatchBundle').MatchBundle)().withGclid('MiXeD+%&').withCustomParam('synthetic', 'Ação+%&');
  const provider = {
    logEvent(name, value) { events.push([name, plain(value)]); if (throwingProvider) throw new Error('synthetic-provider-failure'); },
    setUserProperty(name, value) { properties.push([name, value]); if (throwingProvider) throw new Error('synthetic-provider-failure'); },
  };
  return { sdk, bundle, events, properties, requests, configurations, result, emit: payload => listeners.get('BridgeeAnalytics.logEvent')(payload),
    configure: () => sdk.configure({ tenantId: 'fixture-tenant', tenantKey: 'synthetic-key', provider, dryRun }) };
}
const expectedNames = legacy ? nativeEvents : nativeEvents.filter(name => !name.endsWith('first_open'));
test('legacy firstOpen requires configure', async () => {
  const h = harness(); await assert.rejects(h.sdk.firstOpen(h.bundle), /before configure/); assert.equal(h.requests.length, 0);
});
test('firstOpen preserves payload, UTM return, campaign parameters and properties; analytics delta is explicit', async () => {
  const h = harness(); await h.configure();
  assert.equal(await h.sdk.firstOpen(h.bundle), h.result);
  assert.deepEqual(h.configurations, [['fixture-tenant', 'synthetic-key', false]]);
  assert.deepEqual(h.requests, [plain(h.bundle.toJSON())]);
  assert.equal(h.requests[0].gclid, 'MiXeD+%&');
  assert.equal(h.requests[0].synthetic, 'Ação+%&');
  assert.deepEqual(h.events, expectedNames.map(name => [name, params]));
  assert.deepEqual(h.properties, ['source', 'medium', 'campaign'].map(key => [`install_${key}`, utm[`utm_${key}`]]));
  assert.equal(h.events.some(([name]) => name === 'purchase'), false);
});
test('native rejection preserves exact error and does not deliver analytics', async () => {
  const failure = new Error('synthetic-native-failure'), h = harness({ failure }); await h.configure();
  await assert.rejects(h.sdk.firstOpen(h.bundle), error => error === failure);
  assert.deepEqual(h.events, []); assert.deepEqual(h.properties, []);
});
test('empty native result remains a successful empty UTM response, not an install', async () => {
  const h = harness({ empty: true }); await h.configure();
  assert.equal(await h.sdk.firstOpen(h.bundle), h.result); assert.deepEqual(h.events, []);
});
test('provider exceptions do not replace the successful native result', async () => {
  const h = harness({ throwingProvider: true }); await h.configure();
  assert.equal(await h.sdk.firstOpen(h.bundle), h.result); assert.equal(h.properties.length, 3);
});
test('dryRun is forwarded to native without dropping callback data', async () => {
  const h = harness({ dryRun: true }); await h.configure();
  assert.equal(h.configurations[0][2], true);
  assert.equal(await h.sdk.firstOpen(h.bundle), h.result); assert.deepEqual(h.events, []);
});
test('repeated firstOpen remains repeated resolution, not an exactly-once installation ledger', async () => {
  const h = harness(); await h.configure();
  await h.sdk.firstOpen(h.bundle); await h.sdk.firstOpen(h.bundle);
  assert.equal(h.requests.length, 2); assert.equal(h.events.length, expectedNames.length * 2);
});
test('reconfigure replaces subscriptions rather than duplicating campaign deliveries', async () => {
  const h = harness(); await h.configure(); await h.configure(); await h.sdk.firstOpen(h.bundle);
  assert.equal(h.events.length, expectedNames.length); assert.equal(h.properties.length, 3);
});

test('filter is limited to first_open and the configured hyphen-normalized tenant event', async () => {
  const h = harness(); await h.configure();
  h.emit({ name: 'other_tenant_first_open', params });
  h.emit({ name: 'synthetic_custom_event', params });
  assert.deepEqual(h.events, [['other_tenant_first_open', params], ['synthetic_custom_event', params]]);
});

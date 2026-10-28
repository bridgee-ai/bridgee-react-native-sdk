const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function sdkFor(candidate, fetchImpl) {
  const source = fs.readFileSync('src/BridgeeSDK.ts', 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, global: {}, URL, fetch: fetchImpl, AbortController, setTimeout, clearTimeout,
    require(name) {
      assert.equal(name, 'react-native');
      return {
        NativeEventEmitter: class {},
        NativeModules: { BridgeeSdk: { getDeferredLink: async () => candidate } },
        Platform: { select: () => '' },
      };
    },
  });
  return exports.BridgeeSDK;
}

const options = {
  blinklinkPrefixes: ['https://go.bridgee.app/tenda/'],
  appLinkOrigins: ['https://app.example.com'],
};

test('resolves a tenant-scoped Blinklink response to an allowed App Link', async () => {
  let fetched;
  const sdk = sdkFor('https://go.bridgee.app/tenda/offer', async (url, init) => {
    fetched = { url, init };
    return {
      ok: true,
      headers: { get: () => 'application/vnd.bridgee.deferred+json' },
      json: async () => ({
        link: 'https://go.bridgee.app/tenda/offer',
        appLink: 'https://app.example.com/offer/123',
      }),
    };
  });
  assert.deepEqual({ ...await sdk.getDeferredDestination(options) }, {
    blinklink: 'https://go.bridgee.app/tenda/offer',
    appLink: 'https://app.example.com/offer/123',
  });
  assert.equal(fetched.url, 'https://dash.bridgee.app/api/public/deferred?link=https%3A%2F%2Fgo.bridgee.app%2Ftenda%2Foffer');
  assert.equal(fetched.init.headers.Accept, 'application/vnd.bridgee.deferred+json');
});

test('rejects untrusted source, mismatched response, and foreign App Link origins', async () => {
  const cases = [
    ['https://other.example/offer', { link: 'https://other.example/offer', appLink: 'https://app.example.com/offer' }],
    ['https://go.bridgee.app/foreign/offer', { link: 'https://go.bridgee.app/foreign/offer', appLink: 'https://app.example.com/offer' }],
    ['https://go.bridgee.app/tenda/offer?redirect=https://evil.example', { link: 'https://go.bridgee.app/tenda/offer', appLink: 'https://app.example.com/offer' }],
    ['https://go.bridgee.app/tenda/offer', { link: 'https://go.bridgee.app/other/offer', appLink: 'https://app.example.com/offer' }],
    ['https://go.bridgee.app/tenda/offer', { link: 'https://go.bridgee.app/tenda/offer', appLink: 'https://foreign.example/offer' }],
    ['https://go.bridgee.app/tenda/offer', { link: 'https://go.bridgee.app/tenda/offer', appLink: 'javascript:alert(1)' }],
  ];
  for (const [candidate, payload] of cases) {
    let calls = 0;
    const sdk = sdkFor(candidate, async () => {
      calls += 1;
      return { ok: true, headers: { get: () => 'application/vnd.bridgee.deferred+json' }, json: async () => payload };
    });
    assert.equal(await sdk.getDeferredDestination(options), null);
    if (candidate.includes('other.example') || candidate.includes('/foreign/') || candidate.includes('?')) assert.equal(calls, 0);
  }
});

test('treats missing Play referrer and non-protocol responses as unavailable', async () => {
  const missing = sdkFor(null, async () => { throw new Error('should not fetch'); });
  assert.equal(await missing.getDeferredDestination(options), null);
  const html = sdkFor('https://go.bridgee.app/tenda/offer', async () => ({
    ok: true, headers: { get: () => 'text/html' }, json: async () => ({})
  }));
  assert.equal(await html.getDeferredDestination(options), null);
  const network = sdkFor('https://go.bridgee.app/tenda/offer', async () => { throw new Error('offline'); });
  assert.equal(await network.getDeferredDestination(options), null);
});

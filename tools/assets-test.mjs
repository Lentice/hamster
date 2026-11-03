import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/svg.js', import.meta.url), 'utf8');
function boot({ httpFailure = false, readerFailure = false, imageFailure = false, abort = false } = {}) {
  let requests = 0;
  const revoked = [];
  const context = vm.createContext({
    Blob,
    fetch: async () => {
      requests++;
      return { ok: !httpFailure, status: httpFailure ? 404 : 200, blob: async () => new Blob(['image']) };
    },
    FileReader: class {
      readAsDataURL() {
        queueMicrotask(() => {
          if (abort) this.onabort();
          else if (readerFailure) this.onerror();
          else { this.result = 'data:image/webp;base64,aW1hZ2U='; this.onload(); }
        });
      }
    },
    Image: class {
      set src(value) { queueMicrotask(() => imageFailure ? this.onerror() : this.onload()); }
    },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: (url) => revoked.push(url) },
  });
  vm.runInContext(source, context);
  return { run: (code) => vm.runInContext(code, context), count: () => requests, revoked };
}
const game = boot();
const svg = '<svg><image href="assets/a.webp"/><image href="assets/a.webp"/></svg>';
await Promise.all([game.run(`inlineAssets(${JSON.stringify(svg)})`), game.run(`inlineAssets(${JSON.stringify(svg)})`)]);
assert.equal(game.count(), 1);
assert.ok((await game.run(`inlineAssets(${JSON.stringify(svg)})`)).includes('data:image/webp'));
assert.equal(game.count(), 1);
assert.equal(game.run('assetLoads.size'), 0);
for (const options of [{ httpFailure: true }, { readerFailure: true }, { abort: true }]) {
  const failed = boot(options);
  await assert.rejects(failed.run(`inlineAssets(${JSON.stringify(svg)})`));
  assert.equal(failed.run('assetLoads.size'), 0);
  await assert.rejects(failed.run(`inlineAssets(${JSON.stringify(svg)})`));
  assert.equal(failed.count(), 2, '失敗後必須允許重試');
}
for (const imageFailure of [true, false]) {
  const game = boot({ imageFailure });
  if (imageFailure) await assert.rejects(game.run('svgToImage("<svg/>")'));
  else await game.run('svgToImage("<svg/>")');
  assert.deepEqual(game.revoked, ['blob:test']);
}
console.log('Asset tests passed: concurrent/cache loads, HTTP/read/abort retry, blob cleanup.');

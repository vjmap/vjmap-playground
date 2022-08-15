import { isBrowser, resolvePath, fs, toArrayBuffer } from '@loaders.gl/loader-utils';
import { assert } from '@loaders.gl/loader-utils';
export function readFileSync(url, options = {}) {
  url = resolvePath(url);

  if (!isBrowser) {
    const buffer = fs.readFileSync(url, options);
    return typeof buffer !== 'string' ? toArrayBuffer(buffer) : buffer;
  }

  if (!options.nothrow) {
    assert(false);
  }

  return null;
}
//# sourceMappingURL=read-file.js.map
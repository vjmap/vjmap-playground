import { isBrowser } from '@loaders.gl/loader-utils';
import { makeDOMStream } from './make-dom-stream';
import makeNodeStream from './make-node-stream';
export function makeStream(data, options) {
  return isBrowser ? makeDOMStream(data, options) : makeNodeStream(data, options);
}
//# sourceMappingURL=make-stream.js.map
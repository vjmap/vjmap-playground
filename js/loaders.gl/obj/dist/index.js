import loadOBJ from './lib/load-obj';
import { OBJLoader as OBJWorkerLoader } from './obj-loader';
export { OBJWorkerLoader };
export const OBJLoader = { ...OBJWorkerLoader,
  parse: async (arrayBuffer, options) => loadOBJ(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: loadOBJ
};
export const _typecheckOBJLoader = OBJLoader;
//# sourceMappingURL=index.js.map
const VERSION = typeof "3.0.1" !== 'undefined' ? "3.0.1" : 'latest';
export const NullWorkerLoader = {
  name: 'Null loader',
  id: 'null',
  module: 'core',
  version: VERSION,
  worker: true,
  mimeTypes: ['application/x.empty'],
  extensions: ['null'],
  tests: [() => false],
  options: {
    null: {}
  }
};
export const NullLoader = {
  name: 'Null loader',
  id: 'null',
  module: 'core',
  version: VERSION,
  mimeTypes: ['application/x.empty'],
  extensions: ['null'],
  parse: async arrayBuffer => arrayBuffer,
  parseSync: arrayBuffer => arrayBuffer,
  parseInBatches: async function* generator(asyncIterator) {
    for await (const batch of asyncIterator) {
      yield batch;
    }
  },
  tests: [() => false],
  options: {
    null: {}
  }
};
//# sourceMappingURL=null-loader.js.map
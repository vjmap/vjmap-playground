const VERSION = typeof "3.0.1" !== 'undefined' ? "3.0.1" : 'latest';
export const OBJLoader = {
  name: 'OBJ',
  id: 'obj',
  module: 'obj',
  version: VERSION,
  worker: true,
  extensions: ['obj'],
  mimeTypes: ['text/plain'],
  testText: testOBJFile,
  options: {
    obj: {}
  }
};

function testOBJFile(text) {
  return text[0] === 'v';
}

export const _typecheckOBJLoader = OBJLoader;
//# sourceMappingURL=obj-loader.js.map
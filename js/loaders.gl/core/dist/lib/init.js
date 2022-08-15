import { global } from '@loaders.gl/loader-utils';
const version = typeof "3.0.1" !== 'undefined' ? "3.0.1" : '';
global.loaders = Object.assign(global.loaders || {}, {
  VERSION: version
});
export default global.loaders;
//# sourceMappingURL=init.js.map
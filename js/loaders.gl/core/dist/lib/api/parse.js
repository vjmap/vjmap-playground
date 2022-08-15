import { assert, validateWorkerVersion } from '@loaders.gl/worker-utils';
import { parseWithWorker, canParseWithWorker } from '@loaders.gl/loader-utils';
import { isLoaderObject } from '../loader-utils/normalize-loader';
import { normalizeOptions } from '../loader-utils/option-utils';
import { getArrayBufferOrStringFromData } from '../loader-utils/get-data';
import { getLoaderContext, getLoadersFromContext } from '../loader-utils/loader-context';
import { getResourceUrlAndType } from '../utils/resource-utils';
import { selectLoader } from './select-loader';
export async function parse(data, loaders, options, context) {
  assert(!context || typeof context === 'object');

  if (loaders && !Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = undefined;
    options = loaders;
    loaders = undefined;
  }

  data = await data;
  options = options || {};
  const {
    url
  } = getResourceUrlAndType(data);
  const typedLoaders = loaders;
  const candidateLoaders = getLoadersFromContext(typedLoaders, context);
  const loader = await selectLoader(data, candidateLoaders, options);

  if (!loader) {
    return null;
  }

  options = normalizeOptions(options, loader, candidateLoaders, url);
  context = getLoaderContext({
    url,
    parse,
    loaders: candidateLoaders
  }, options, context);
  return await parseWithLoader(loader, data, options, context);
}

async function parseWithLoader(loader, data, options, context) {
  validateWorkerVersion(loader);
  data = await getArrayBufferOrStringFromData(data, loader, options);

  if (loader.parseTextSync && typeof data === 'string') {
    options.dataType = 'text';
    return loader.parseTextSync(data, options, context, loader);
  }

  if (canParseWithWorker(loader, options)) {
    return await parseWithWorker(loader, data, options, context, parse);
  }

  if (loader.parseText && typeof data === 'string') {
    return await loader.parseText(data, options, context, loader);
  }

  if (loader.parse) {
    return await loader.parse(data, options, context, loader);
  }

  assert(!loader.parseSync);
  throw new Error(`${loader.id} loader - no parser found and worker is disabled`);
}
//# sourceMappingURL=parse.js.map
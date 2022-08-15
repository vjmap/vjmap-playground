import { assert, concatenateArrayBuffersAsync } from '@loaders.gl/loader-utils';
import { isLoaderObject } from '../loader-utils/normalize-loader';
import { normalizeOptions } from '../loader-utils/option-utils';
import { getLoaderContext } from '../loader-utils/loader-context';
import { getAsyncIterableFromData } from '../loader-utils/get-data';
import { getResourceUrlAndType } from '../utils/resource-utils';
import { selectLoader } from './select-loader';
import { parse } from './parse';
export async function parseInBatches(data, loaders, options, context) {
  assert(!context || typeof context === 'object');

  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = undefined;
    options = loaders;
    loaders = undefined;
  }

  data = await data;
  options = options || {};
  const {
    url
  } = getResourceUrlAndType(data);
  const loader = await selectLoader(data, loaders, options);

  if (!loader) {
    return null;
  }

  options = normalizeOptions(options, loader, loaders, url);
  context = getLoaderContext({
    url,
    parseInBatches,
    parse,
    loaders: loaders
  }, options, context);
  return await parseWithLoaderInBatches(loader, data, options, context);
}

async function parseWithLoaderInBatches(loader, data, options, context) {
  const outputIterator = await parseToOutputIterator(loader, data, options, context);

  if (!options.metadata) {
    return outputIterator;
  }

  const metadataBatch = {
    batchType: 'metadata',
    metadata: {
      _loader: loader,
      _context: context
    },
    data: [],
    bytesUsed: 0
  };

  async function* makeMetadataBatchIterator(iterator) {
    yield metadataBatch;
    yield* iterator;
  }

  return makeMetadataBatchIterator(outputIterator);
}

async function parseToOutputIterator(loader, data, options, context) {
  const inputIterator = await getAsyncIterableFromData(data, options);
  const transformedIterator = await applyInputTransforms(inputIterator, (options === null || options === void 0 ? void 0 : options.transforms) || []);

  if (loader.parseInBatches) {
    return loader.parseInBatches(transformedIterator, options, context);
  }

  async function* parseChunkInBatches() {
    const arrayBuffer = await concatenateArrayBuffersAsync(transformedIterator);
    const parsedData = await parse(arrayBuffer, loader, { ...options,
      mimeType: loader.mimeTypes[0]
    }, context);
    const batch = {
      mimeType: loader.mimeTypes[0],
      shape: Array.isArray(parsedData) ? 'row-table' : 'unknown',
      batchType: 'data',
      data: parsedData,
      length: Array.isArray(parsedData) ? parsedData.length : 1
    };
    yield batch;
  }

  return parseChunkInBatches();
}

async function applyInputTransforms(inputIterator, transforms = []) {
  let iteratorChain = inputIterator;

  for await (const transformBatches of transforms) {
    iteratorChain = transformBatches(iteratorChain);
  }

  return iteratorChain;
}
//# sourceMappingURL=parse-in-batches.js.map
import { compareArrayBuffers } from '@loaders.gl/loader-utils';
import { normalizeLoader } from '../loader-utils/normalize-loader';
import { getResourceUrlAndType } from '../utils/resource-utils';
import { getRegisteredLoaders } from './register-loaders';
import { isBlob } from '../../javascript-utils/is-type';
const EXT_PATTERN = /\.([^.]+)$/;
export async function selectLoader(data, loaders = [], options, context) {
  if (!validHTTPResponse(data)) {
    return null;
  }

  let loader = selectLoaderSync(data, loaders, { ...options,
    nothrow: true
  }, context);

  if (loader) {
    return loader;
  }

  if (isBlob(data)) {
    data = await data.slice(0, 10).arrayBuffer();
    loader = selectLoaderSync(data, loaders, options, context);
  }

  if (!loader && !(options !== null && options !== void 0 && options.nothrow)) {
    throw new Error(getNoValidLoaderMessage(data));
  }

  return loader;
}
export function selectLoaderSync(data, loaders = [], options, context) {
  if (!validHTTPResponse(data)) {
    return null;
  }

  if (loaders && !Array.isArray(loaders)) {
    return normalizeLoader(loaders);
  }

  let candidateLoaders = [];

  if (loaders) {
    candidateLoaders = candidateLoaders.concat(loaders);
  }

  if (!(options !== null && options !== void 0 && options.ignoreRegisteredLoaders)) {
    candidateLoaders.push(...getRegisteredLoaders());
  }

  normalizeLoaders(candidateLoaders);
  const loader = selectLoaderInternal(data, candidateLoaders, options, context);

  if (!loader && !(options !== null && options !== void 0 && options.nothrow)) {
    throw new Error(getNoValidLoaderMessage(data));
  }

  return loader;
}

function selectLoaderInternal(data, loaders, options, context) {
  const {
    url,
    type
  } = getResourceUrlAndType(data);
  const testUrl = url || (context === null || context === void 0 ? void 0 : context.url);
  let loader = null;

  if (options !== null && options !== void 0 && options.mimeType) {
    loader = findLoaderByMIMEType(loaders, options === null || options === void 0 ? void 0 : options.mimeType);
  }

  loader = loader || findLoaderByUrl(loaders, testUrl);
  loader = loader || findLoaderByMIMEType(loaders, type);
  loader = loader || findLoaderByInitialBytes(loaders, data);
  loader = loader || findLoaderByMIMEType(loaders, options === null || options === void 0 ? void 0 : options.fallbackMimeType);
  return loader;
}

function validHTTPResponse(data) {
  if (data instanceof Response) {
    if (data.status === 204) {
      return false;
    }
  }

  return true;
}

function getNoValidLoaderMessage(data) {
  const {
    url,
    type
  } = getResourceUrlAndType(data);
  let message = 'No valid loader found';

  if (data) {
    message += ` data: "${getFirstCharacters(data)}", contentType: "${type}"`;
  }

  if (url) {
    message += ` url: ${url}`;
  }

  return message;
}

function normalizeLoaders(loaders) {
  for (const loader of loaders) {
    normalizeLoader(loader);
  }
}

function findLoaderByUrl(loaders, url) {
  const match = url && EXT_PATTERN.exec(url);
  const extension = match && match[1];
  return extension ? findLoaderByExtension(loaders, extension) : null;
}

function findLoaderByExtension(loaders, extension) {
  extension = extension.toLowerCase();

  for (const loader of loaders) {
    for (const loaderExtension of loader.extensions) {
      if (loaderExtension.toLowerCase() === extension) {
        return loader;
      }
    }
  }

  return null;
}

function findLoaderByMIMEType(loaders, mimeType) {
  for (const loader of loaders) {
    if (loader.mimeTypes && loader.mimeTypes.includes(mimeType)) {
      return loader;
    }

    if (mimeType === `application/x.${loader.id}`) {
      return loader;
    }
  }

  return null;
}

function findLoaderByInitialBytes(loaders, data) {
  if (!data) {
    return null;
  }

  for (const loader of loaders) {
    if (typeof data === 'string') {
      if (testDataAgainstText(data, loader)) {
        return loader;
      }
    } else if (ArrayBuffer.isView(data)) {
      if (testDataAgainstBinary(data.buffer, data.byteOffset, loader)) {
        return loader;
      }
    } else if (data instanceof ArrayBuffer) {
      const byteOffset = 0;

      if (testDataAgainstBinary(data, byteOffset, loader)) {
        return loader;
      }
    }
  }

  return null;
}

function testDataAgainstText(data, loader) {
  if (loader.testText) {
    return loader.testText(data);
  }

  const tests = Array.isArray(loader.tests) ? loader.tests : [loader.tests];
  return tests.some(test => data.startsWith(test));
}

function testDataAgainstBinary(data, byteOffset, loader) {
  const tests = Array.isArray(loader.tests) ? loader.tests : [loader.tests];
  return tests.some(test => testBinary(data, byteOffset, loader, test));
}

function testBinary(data, byteOffset, loader, test) {
  if (test instanceof ArrayBuffer) {
    return compareArrayBuffers(test, data, test.byteLength);
  }

  switch (typeof test) {
    case 'function':
      return test(data, loader);

    case 'string':
      const magic = getMagicString(data, byteOffset, test.length);
      return test === magic;

    default:
      return false;
  }
}

function getFirstCharacters(data, length = 5) {
  if (typeof data === 'string') {
    return data.slice(0, length);
  } else if (ArrayBuffer.isView(data)) {
    return getMagicString(data.buffer, data.byteOffset, length);
  } else if (data instanceof ArrayBuffer) {
    const byteOffset = 0;
    return getMagicString(data, byteOffset, length);
  }

  return '';
}

function getMagicString(arrayBuffer, byteOffset, length) {
  if (arrayBuffer.byteLength < byteOffset + length) {
    return '';
  }

  const dataView = new DataView(arrayBuffer);
  let magic = '';

  for (let i = 0; i < length; i++) {
    magic += String.fromCharCode(dataView.getUint8(byteOffset + i));
  }

  return magic;
}
//# sourceMappingURL=select-loader.js.map
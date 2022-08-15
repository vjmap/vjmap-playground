import { getFetchFunction } from './option-utils';
export function getLoaderContext(context, options, previousContext = null) {
  if (previousContext) {
    return previousContext;
  }

  const resolvedContext = {
    fetch: getFetchFunction(options, context),
    ...context
  };

  if (!Array.isArray(resolvedContext.loaders)) {
    resolvedContext.loaders = null;
  }

  return resolvedContext;
}
export function getLoadersFromContext(loaders, context) {
  if (!context && loaders && !Array.isArray(loaders)) {
    return loaders;
  }

  let candidateLoaders;

  if (loaders) {
    candidateLoaders = Array.isArray(loaders) ? loaders : [loaders];
  }

  if (context && context.loaders) {
    const contextLoaders = Array.isArray(context.loaders) ? context.loaders : [context.loaders];
    candidateLoaders = candidateLoaders ? [...candidateLoaders, ...contextLoaders] : contextLoaders;
  }

  return candidateLoaders && candidateLoaders.length ? candidateLoaders : null;
}
//# sourceMappingURL=loader-context.js.map
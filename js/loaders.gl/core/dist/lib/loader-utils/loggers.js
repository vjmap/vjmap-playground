import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import { Log } from 'probe.gl';
export const probeLog = new Log({
  id: 'loaders.gl'
});
export class NullLog {
  log() {
    return () => {};
  }

  info() {
    return () => {};
  }

  warn() {
    return () => {};
  }

  error() {
    return () => {};
  }

}
export class ConsoleLog {
  constructor() {
    _defineProperty(this, "console", void 0);

    this.console = console;
  }

  log(...args) {
    return this.console.log.bind(this.console, ...args);
  }

  info(...args) {
    return this.console.info.bind(this.console, ...args);
  }

  warn(...args) {
    return this.console.warn.bind(this.console, ...args);
  }

  error(...args) {
    return this.console.error.bind(this.console, ...args);
  }

}
//# sourceMappingURL=loggers.js.map
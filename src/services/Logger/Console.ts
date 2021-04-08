import { Logger } from './Logger';

export function factory() {
  return () => new ConsoleLogger();
}

export class ConsoleLogger implements Logger {
  debug(msg: string) {
    console.debug(msg);
  }

  info(msg: string) {
    console.log(msg);
  }

  warn(msg: string) {
    console.warn(msg);
  }

  error(msg: string) {
    console.error(msg);
  }
}

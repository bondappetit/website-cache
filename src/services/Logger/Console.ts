import dayjs from 'dayjs';
import { Logger } from './Logger';

export class ConsoleLogger implements Logger {
  format(type: string, msg: string) {
    return `${type} [${dayjs().format('DD-MM-YYYY HH:mm:ss Z')}]: ${msg}`;
  }

  debug(msg: string) {
    console.debug(this.format('DEBUG', msg));
  }

  info(msg: string) {
    console.log(this.format('INFO', msg));
  }

  warn(msg: string) {
    console.warn(this.format('WARN', msg));
  }

  error(msg: string) {
    console.error(this.format('ERROR', msg));
  }
}

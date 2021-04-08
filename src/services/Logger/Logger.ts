export interface Logger {
  debug(msg: string): any;

  info(msg: string): any;

  warn(msg: string): any;

  error(msg: string): any;
}

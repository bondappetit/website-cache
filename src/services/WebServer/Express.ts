import { Server, createServer } from 'http';
import express from 'express';

export interface FactoryConfig {
  readonly port: number;
}

export function factory({ port }: FactoryConfig) {
  const app = express();
  const server = createServer(app);

  return new WebServer(app, server, port);
}

export class WebServer {
  constructor(
    public readonly express: express.Express = express,
    public readonly server: Server = server,
    public readonly port: number = port,
  ) {}

  listen(): Promise<WebServer> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => resolve(this));
    });
  }
}

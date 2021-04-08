import { Request, Response, NextFunction } from 'express';
import container from '@container';
import { Network } from '@services/Network/Network';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare global {
  namespace Express {
    export interface Request {
      currentNetwork: Network;
    }
  }
}

export function currentNetwork(req: Request, res: Response, next: NextFunction) {
  req.currentNetwork = container.network(parseInt(req.header('chain-id') ?? '', 10));

  return next();
}

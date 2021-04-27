import { Request, Response, NextFunction } from 'express';
import container from '@container';
import { Network } from '@services/Network/Network';
import dayjs from 'dayjs';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare global {
  namespace Express {
    export interface Request {
      currentNetwork: Network;
      currentBlockNumber: number;
    }
  }
}

export async function currentNetwork(req: Request, res: Response, next: NextFunction) {
  req.currentNetwork = container.network(parseInt(req.header('chain-id') ?? '', 10));
  req.currentBlockNumber = await container
    .memoryCache()
    .cache(`${req.currentNetwork.id}-currentBlockNumber`, async () => [
      (await container.ethereum.get(req.currentNetwork.id)?.eth.getBlockNumber()) ?? 0,
      dayjs().add(15, 'seconds').toDate(),
    ]);

  return next();
}

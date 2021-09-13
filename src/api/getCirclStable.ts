import container from '@container';
import BigNumber from 'bignumber.js';
import { Request, Response } from 'express';
import { AbiItem } from 'web3-utils';
import networks from '@bondappetit/networks';
import dayjs from 'dayjs';
import { makeBatchRequest } from '@services/Ethereum/Web3';

export async function getCirclStable(req: Request, res: Response) {
  const value = await container.memoryCache().cache('circl-stable', async () => {
    const mainEthProvider = container.ethereum.get(1);
    if (!mainEthProvider) return ['0', dayjs().add(1, 'minutes').toDate()];
    const mainETHNetwork = container.network(1);
    if (!mainETHNetwork) return ['0', dayjs().add(1, 'minutes').toDate()];
    const stable = new mainEthProvider.eth.Contract(
      networks.main.contracts.Stable.abi as AbiItem[],
      networks.main.contracts.Stable.address,
    );
    const { contracts } = mainETHNetwork.data;

    const totalSupply = await stable.methods.totalSupply().call();
    const balances = await makeBatchRequest(mainEthProvider, [
      stable.methods.balanceOf(contracts.Treasury.address).call,
      stable.methods.balanceOf(contracts.Issuer.address).call,
      stable.methods.balanceOf(contracts.BuybackDepositaryBalanceView.address).call,
      stable.methods.balanceOf(contracts.UniV2BuybackDepositaryBalanceView.address).call,
      ...(contracts.Market ? [stable.methods.balanceOf(contracts.Market.address).call] : []),
    ]);
    const balancesSum = balances.reduce((sum, balance) => sum.plus(balance), new BigNumber(0));

    return [
      new BigNumber(totalSupply).minus(balancesSum).div(new BigNumber(10).pow(18)).toString(),
      dayjs().add(1, 'minutes').toDate(),
    ];
  });

  return res.send(value);
}

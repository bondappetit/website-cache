import BigNumber from 'bignumber.js';
import ERC20 from '@bondappetit/networks/abi/ERC20.json';
import UniswapRouter from '@bondappetit/networks/abi/IUniswapV2Router02.json';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';

export interface FactoryConfig {
  type: 'uniswap';
  routerAddress: string;
  path: string[];
}

export function factory(web3: Web3, { routerAddress, path }: FactoryConfig) {
  if (path.length < 2) throw new Error(`Invalid path for uniswap price feed`);

  return async (def: string) => {
    try {
      const uniswap = new web3.eth.Contract(UniswapRouter.abi as AbiItem[], routerAddress);
      const token0 = new web3.eth.Contract(ERC20.abi as AbiItem[], path[0]);
      const token0Decimals = await token0.methods.decimals().call();
      const token1 = new web3.eth.Contract(ERC20.abi as AbiItem[], path[path.length - 1]);
      const token1Decimals = await token1.methods.decimals().call();

      const amountsOut = await uniswap.methods
        .getAmountsOut(new BigNumber(10).pow(token0Decimals).toString(), path)
        .call();

      return new BigNumber(amountsOut[amountsOut.length - 1])
        .div(new BigNumber(10).pow(token1Decimals))
        .toString(10);
    } catch (e) {
      return def;
    }
  };
}

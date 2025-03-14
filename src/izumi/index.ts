import Web3 from 'web3'
import * as ethers from "ethers";
import { BigNumber } from 'bignumber.js'
import { parseEther, parseUnits, formatUnits, formatEther } from "ethers/lib/utils";
import * as erc20 from '../utils/erc20'
import { sleep } from '../utils/time'

import { BaseChain, ChainId, initialChainTable } from 'iziswap-sdk/lib/base/types';
import { amount2Decimal, fetchToken, getErc20TokenContract } from 'iziswap-sdk/lib/base/token/token';
import { SwapChainWithExactInputParams } from 'iziswap-sdk/lib/swap/types';
import { QuoterSwapChainWithExactInputParams } from 'iziswap-sdk/lib/quoter/types';
import { getSwapChainWithExactInputCall, getSwapContract } from 'iziswap-sdk/lib/swap/funcs';
import { getQuoterContract, quoterSwapChainWithExactInput } from 'iziswap-sdk/lib/quoter/funcs';
import { calciZiLiquidityAmountDesired } from 'iziswap-sdk/lib/liquidityManager/calc';
import { getBoxContract, getMintCall } from 'iziswap-sdk/lib/box';

import { PriceRoundingType } from 'iziswap-sdk/lib/base/types';
import { getPointDelta, getPoolContract, getPoolState } from 'iziswap-sdk/lib/pool/funcs';
import { getPoolAddress, getLiquidityManagerContract } from 'iziswap-sdk/lib/liquidityManager/view';
import { pointDeltaRoundingDown, pointDeltaRoundingUp, priceDecimal2Point } from 'iziswap-sdk/lib/base/price';

import { fetchLiquiditiesOfAccount } from 'iziswap-sdk/lib/liquidityManager/view';
import { getDecLiquidityCall } from 'iziswap-sdk/lib/liquidityManager/liquidity';
import { getWithdrawLiquidityValue } from 'iziswap-sdk/lib/liquidityManager/calc';
import { DecLiquidityParam } from 'iziswap-sdk/lib/liquidityManager/types';


import { IZUMI_ERA_MAIN } from './config'

import colors from 'colors'
colors.enable()


export class Izumi {
    private_key: string;
    from_token: string;
    to_token: string;
    amount_from: string;
    amount_to: string;
    router_address: string;
    // router_abi: string;
    quoter_address: string;
    //factory_abi:string;
    chain_rpc: string;
    address_wallet: string;

    constructor(private_key: string, router_address: string, quoter_address: string, chain_rpc: string) {
        this.private_key = private_key
        this.router_address = router_address
        this.quoter_address = quoter_address
        this.chain_rpc = chain_rpc
    }

    public async swap(from_token: string, to_token: string, token: string, amountIn: string) {
        try {
            const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
            this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address

            const quoterContract = getQuoterContract(this.quoter_address, web3)

            const chain: BaseChain = initialChainTable[ChainId.ZkSyncEra]
            // TokenInfoFormatted of token 'testA' and token 'testB'
            const AAddress = await fetchToken(from_token, chain, web3)
            const BAddress = await fetchToken(to_token, chain, web3)

            const fee = 2000 // 2000 means 0.2%

            let tokenABalanceBeforeSwap
            if (token.toUpperCase() != "ETH") {
                tokenABalanceBeforeSwap = await erc20.getBalance(AAddress.address, this.address_wallet, web3)
            } else {
                tokenABalanceBeforeSwap = await web3.eth.getBalance(this.address_wallet)
            }
            const tokenBBalanceBeforeSwap = await erc20.getBalance(BAddress.address, this.address_wallet, web3)

            console.log('tokenABalanceBeforeSwap: ', tokenABalanceBeforeSwap)
            console.log('tokenBBalanceBeforeSwap: ', tokenBBalanceBeforeSwap)

            const amountA = new BigNumber(amountIn).times(10 ** AAddress.decimal)

            if (amountA.gt(tokenABalanceBeforeSwap) || amountA.eq(0)) {
                throw Error('A balance not enough');
            }

            const params = {
                // pay testA to buy testB
                tokenChain: [AAddress, BAddress],
                feeChain: [fee],
                inputAmount: amountA.toFixed(0)
            } as QuoterSwapChainWithExactInputParams

            console.log(params)

            // const path = getTokenChainPath(params.tokenChain, params.feeChain)
            // console.log(path)
            // const {acquire, pointAfterList} = await quoterContract.methods.swapAmount(params.inputAmount, path).call()

            const { outputAmount } = await quoterSwapChainWithExactInput(quoterContract, params)

            const amountB = outputAmount
            const amountBDecimal = amount2Decimal(new BigNumber(amountB), BAddress)

            console.log(' amountA to pay: ', 1)
            console.log(' amountB to acquire: ', amountBDecimal)

            const router_contract = getSwapContract(this.router_address, web3)

            // example of swap

            const swapParams = {
                ...params,
                // slippery is 1.5%
                minOutputAmount: new BigNumber(amountB).times(0.9).toFixed(0)
            } as SwapChainWithExactInputParams

            const { swapCalling, options } = getSwapChainWithExactInputCall(
                router_contract,
                this.address_wallet,
                chain,
                swapParams,
                await web3.eth.getGasPrice()
            )

            await erc20.approve(AAddress.address, this.address_wallet, this.router_address, this.private_key, web3)

            // before estimate gas and send transaction, 
            // make sure you have approve swapAddress of token testA
            const gasLimit = await swapCalling.estimateGas(options)
            console.log('gas limit: ', gasLimit)

            //const gasLimit = 103543498

            // for metamask or other explorer's wallet provider
            // one can easily use 
            //
            //    await swapCalling.send({...options, gas: gasLimit})
            //
            // instead of following 
            // 'web3.eth.accounts.signTransaction' 
            // and 'web3.eth.sendSignedTransaction'

            const signedTx = await web3.eth.accounts.signTransaction(
                {
                    ...options,
                    to: this.router_address,
                    data: swapCalling.encodeABI(),
                    gas: new BigNumber(gasLimit * 1.1).toFixed(0, 2),
                    nonce: await web3.eth.getTransactionCount(this.address_wallet),
                },
                this.private_key
            )

            const tx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction || '');

            const tokenABalanceAfterSwap = await erc20.getBalance(AAddress.address, this.address_wallet, web3)
            const tokenBBalanceAfterSwap = await erc20.getBalance(BAddress.address, this.address_wallet, web3)

            console.log('tokenABalanceAfterSwap: ', tokenABalanceAfterSwap)
            console.log('tokenBBalanceAfterSwap: ', tokenBBalanceAfterSwap)

            console.log('payed A: ', new BigNumber(tokenABalanceBeforeSwap.toString()).minus(tokenABalanceAfterSwap.toString()).toFixed(0))
            console.log('acquired B: ', new BigNumber(tokenBBalanceAfterSwap.toString()).minus(tokenBBalanceBeforeSwap.toString()).toFixed(0))

        } catch (error) {
            console.error(error)
        }
    }

    public async addLiquidity(a_token: string, b_token: string, token: string, amount_a: string, amount_b: string) {
        try {
            const chain: BaseChain = initialChainTable[ChainId.ZkSyncEra]
            const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))

            this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address

            const boxContract = getBoxContract(this.router_address, web3)

            const AAddress = a_token // USDC
            const BAddress = b_token // USDT

            let tokenABalanceBeforeSwap
            if (token.toUpperCase() === 'ETH') {
                tokenABalanceBeforeSwap = await web3.eth.getBalance(this.address_wallet)
            } else {
                tokenABalanceBeforeSwap = await erc20.getBalance(AAddress, this.address_wallet, web3)
            }

            console.debug('tokenABalanceBeforeSwap: ', tokenABalanceBeforeSwap)

            // TokenInfoFormatted of token 'testA' and token 'testB'
            const feeA = await fetchToken(AAddress, chain, web3)
            const feeB = await fetchToken(BAddress, chain, web3)
            const fee = 2000 // 2000 means 0.2%

            console.log(feeA)

            const amountA = new BigNumber(amount_a).times(10 ** feeA.decimal)

            if (amountA.gt(tokenABalanceBeforeSwap) || amountA.eq(0)) {
                throw Error('A balance not enough');
            }

            const liquidityManagerContract = getLiquidityManagerContract(this.quoter_address, web3)

            const poolAddress = await getPoolAddress(liquidityManagerContract, feeA, feeB, fee)
            const pool = getPoolContract(poolAddress, web3)

            const state = await getPoolState(pool)
            console.debug('state: ', state)

            const point1 = priceDecimal2Point(feeA, feeB, 1.6, PriceRoundingType.PRICE_ROUNDING_NEAREST)
            const point2 = priceDecimal2Point(feeA, feeB, 2.4, PriceRoundingType.PRICE_ROUNDING_NEAREST)

            console.debug('point1: ', point1)
            console.debug('point2: ', point2)

            const pointDelta = await getPointDelta(pool)

            console.debug('pointDelta: ', pointDelta)

            const leftPoint = pointDeltaRoundingDown(Math.min(point1, point2), pointDelta)
            const rightPoint = pointDeltaRoundingUp(Math.max(point1, point2), pointDelta)

            console.debug('left point: ', leftPoint)
            console.debug('right point: ', rightPoint)

            const maxFeeA = new BigNumber(amount_a).times(10 ** feeA.decimal)
            const maxFeeB = calciZiLiquidityAmountDesired(
                leftPoint, rightPoint, state.currentPoint,
                maxFeeA, true, feeA, feeB
            )
            console.debug('max maxFeeA: ', maxFeeA.toFixed(0))
            console.debug('max maxFeeB: ', maxFeeB.toFixed(0))

            const maxFeeBDecimal = amount2Decimal(maxFeeA, feeB)

            console.debug('maxFeeBDecimal: ', maxFeeBDecimal)

            // esitmate gas
            const mintParams = {
                tokenA: feeA,
                tokenB: feeB,
                fee,
                leftPoint,
                rightPoint,
                maxAmountA: maxFeeA.toFixed(0),
                maxAmountB: maxFeeB.toFixed(0),
                minAmountA: maxFeeA.times(0.8).toFixed(0),
                minAmountB: maxFeeB.times(0.8).toFixed(0),
            }  

            const { mintCalling, options } = getMintCall(
                boxContract,
                this.address_wallet,
                chain,
                mintParams,
                await web3.eth.getGasPrice(),    
            )

            let amount_in
            if (token.toUpperCase() === 'ETH') {
                amount_in = parseEther(amount_a)
                console.debug(`value:${amount_in}`)
            } else {
                await erc20.approve(AAddress, this.address_wallet, this.router_address, this.private_key, web3)
                amount_in = 0
            }
            options['value'] = amount_in

            console.log(options)

            let liquid_tx = {
                ...options,
                to: this.router_address,
                data: mintCalling.encodeABI(),
                nonce: await web3.eth.getTransactionCount(this.address_wallet),
            }

            const gasLimit = await web3.eth.estimateGas(liquid_tx)
            liquid_tx['gas'] = new BigNumber(gasLimit * 1.1).toFixed(0, 2)

            // for metamask or other explorer's wallet provider
            // one can easily use 
            //
            //    await collectLimitOrderCalling.send({...options, gas: gasLimit})
            //
            // instead of following 
            // 'web3.eth.accounts.signTransaction' 
            // and 'web3.eth.sendSignedTransaction'


            const signedTx = await web3.eth.accounts.signTransaction(liquid_tx, this.private_key)
            const raw_tx_hash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction || '');

            const tokenAContract = getErc20TokenContract(AAddress, web3)
            const tokenBContract = getErc20TokenContract(BAddress, web3)

            const tokenABalanceBeforeCollect = await tokenAContract.methods.balanceOf(this.address_wallet).call()
            const tokenBBalanceBeforeCollect = await tokenBContract.methods.balanceOf(this.address_wallet).call()

            console.debug('tokenABalanceBeforeCollect: ', tokenABalanceBeforeCollect.toString())
            console.debug('tokenBBalanceBeforeCollect: ', tokenBBalanceBeforeCollect.toString())

            const liquidities = await fetchLiquiditiesOfAccount(
                chain,
                web3,
                liquidityManagerContract,
                this.address_wallet,
                [feeA]
            )
            console.log(`wallet ${this.address_wallet} remove ${amount_a} ${token} tokens ,add liquidity:${liquidities[0].liquidity} to liquidity pool on izumi | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)
        } catch (error) {
            console.error(error)
        }
    }

    public async burnLiquidity(a_token: string, b_token: string, token: string, amount_lp: string) {

    }
}
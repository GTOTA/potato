import Web3 from 'web3'
import { BigNumber } from "ethers";

import { solidityPack, parseEther, parseUnits, formatUnits, formatEther } from "ethers/lib/utils";
import * as erc20 from '../utils/erc20'
import { sleep } from '../utils/time'

export class Spacefi {
    private_key: string;
    amount_from: string;
    amount_to: string;
    router_address: string;
    factory_address: string;
    chain_rpc: string;
    address_wallet: string;

    router_abi = require("../../abis/spacefi/spacefi_swap_router.json")
    factory_abi = require("../../abis/spacefi/factory.json")
    pool_abi = require("../../abis/spacefi/classic_pool.json")


    constructor(private_key: string, router_address: string, factory_address: string, chain_rpc: string) {
        this.private_key = private_key
        this.router_address = router_address
        this.factory_address = factory_address
        this.chain_rpc = chain_rpc
    }

    public async swap(from_token: string, to_token: string, token: string, amountIn: string) {

        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))

        this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address
        let eth_balance = await web3.eth.getBalance(this.address_wallet)
        console.debug('eth_balance:' + eth_balance)
        if (token.toUpperCase() === "ETH" && parseEther(amountIn).gt(eth_balance)) {
            throw Error('eth_balance not enough');
        }

        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);

        let token_balance = await erc20.getBalance(to_token, this.address_wallet, web3)
        console.debug(`tokenBalance before: ${formatUnits(token_balance, 6)}`)

        const tx_data = router_contract.methods.swapExactETHForTokens(
            0,
            [from_token, to_token],
            this.address_wallet,
            BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)).encodeABI()

        let tx = {
            nounce: await web3.eth.getTransactionCount(this.address_wallet),
            gasPrice: await web3.eth.getGasPrice(),
            from: this.address_wallet,
            to: this.router_address,
            value: web3.utils.toHex(web3.utils.toWei(amountIn, 'ether')),
            data: tx_data
        };

        let gasLimit = await web3.eth.estimateGas(tx)
        tx['gas'] = gasLimit

        let signed_tx = await web3.eth.accounts.signTransaction(tx, this.private_key)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

        const afterBalance = await erc20.getBalance(to_token, this.address_wallet, web3)
        console.debug(`tokenBalance: ${formatUnits(afterBalance, 6)}`)
        console.log(`Swapped transaction: ${amountIn} ${from_token} tokens => ${to_token} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);
    }

    public async addLiquidity(a_token: string, b_token: string, token: string, amount_a: string, amount_b: string) {

        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))

        this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address

        let eth_balance = await web3.eth.getBalance(this.address_wallet)
        console.debug('eth_balance:' + eth_balance)
        if (token.toUpperCase() === "ETH" && parseEther(amount_a).gt(eth_balance)) {
            throw Error('eth_balance not enough');
        }

        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);

        let factory_contract = new web3.eth.Contract(this.factory_abi, this.factory_address);

        let pair = await factory_contract.methods.getPair(a_token, b_token).call()

        let pair_contract = new web3.eth.Contract(this.pool_abi, pair);
        // Sorts the reserves by token addresses.
        //const [reserveETH, reserveErc20] = from_token < to_token ? reserves : [reserves[1], reserves[0]];

        let amountOut = await router_contract.methods.getAmountsOut(parseEther(amount_a), [a_token, b_token]).call();

        console.debug(`amountOut: ${formatUnits(amountOut[1], 6)}`)

        await erc20.approve(b_token, this.address_wallet, this.router_address, this.private_key, web3)

        if(BigNumber.from(amountOut[1]).gt(await erc20.getBalance(b_token,this.address_wallet,web3))) {
            throw Error(`${b_token} balance not enough`);
        }

        const liquid_tx_data = router_contract.methods.addLiquidityETH(
            b_token,
            amountOut[1],
            0,
            0,
            this.address_wallet,
            BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)).encodeABI()

        let liquid_tx = {
            nounce: await web3.eth.getTransactionCount(this.address_wallet),
            gasPrice: await web3.eth.getGasPrice(),
            from: this.address_wallet,
            to: this.router_address,
            value: web3.utils.toHex(web3.utils.toWei(amount_a, 'ether')),
            data: liquid_tx_data
        };

        liquid_tx['gas'] = await web3.eth.estimateGas(liquid_tx)
        //liquid_tx['gas'] = 2470000
        let signed_tx = await web3.eth.accounts.signTransaction(liquid_tx, this.private_key)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

        const lp_Balance = await pair_contract.methods.balanceOf(this.address_wallet).call();
        console.debug(`lp balance after addliquity: ${formatEther(lp_Balance)}`)

        console.log(`Added ${amount_a} ${token} to liquidity pool on SpaceFI | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)
    }

    public async burnLiquidity(a_token: string, b_token: string, token: string, amount_lp: string) 
    {
        let lp_percent = parseInt(amount_lp)
        if (lp_percent == 0 || lp_percent > 100) {
            throw Error('lp_percent must be in 0 - 100"');;
        }
        
        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
        this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address

        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);

        let factory_contract = new web3.eth.Contract(this.factory_abi, this.factory_address);

        let pair = await factory_contract.methods.getPair(a_token, b_token).call()
        let pair_contract = new web3.eth.Contract(this.pool_abi, pair);

        const lp_Balance = await pair_contract.methods.balanceOf(this.address_wallet).call();

        if(lp_Balance == 0 ) {
            throw Error('lp_Balance must be > 0');;
        }

        const liquidity = BigNumber.from(lp_Balance).mul(BigNumber.from(lp_percent)).div(BigNumber.from(100))
        console.debug(formatEther(liquidity))

        await erc20.approve(pair, this.address_wallet, this.router_address, this.private_key, web3)

        const reliquid_tx_data =  router_contract.methods.removeLiquidity(
            a_token,
            b_token,
            liquidity,
            0,
            0,
            this.address_wallet,
            BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)).encodeABI()
          
        let reliquid_tx = {
            nounce: await web3.eth.getTransactionCount(this.address_wallet),
            gasPrice: await web3.eth.getGasPrice(),
            from: this.address_wallet,
            to: this.router_address,
            value: 0,
            data: reliquid_tx_data
        };
    
        reliquid_tx['gas'] = await web3.eth.estimateGas(reliquid_tx)
        let signed_tx = await web3.eth.accounts.signTransaction(reliquid_tx, this.private_key)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '') 
    
        console.log(formatEther(await pair_contract.methods.balanceOf(this.address_wallet).call()))
        const toBalance = await erc20.getBalance(b_token,this.address_wallet,web3)
    
        console.log(`after remove lp,toBalance balance: ${formatUnits(toBalance.toString(),6)}`)
    
        console.log(`remove ${formatEther(liquidity)} tokens from liquidity pool on SpaceFI | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)

    }


}
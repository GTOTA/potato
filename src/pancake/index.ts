import Web3 from 'web3'
import { BigNumber ,constants} from "ethers";

import { parseEther, parseUnits, formatUnits, formatEther } from "ethers/lib/utils";
import * as erc20 from '../utils/erc20'

import dotenv from "dotenv";
dotenv.config();

const slippage = 0.005 // 0.5%

export class Pancake {
    private_key: string;
    from_token: string;
    to_token: string;
    amount_from: string;
    amount_to: string;
    router_address: string;
    factory_address: string;
    chain_rpc: string;
    address_wallet: string;

    router_abi = require('../../abis/pancake/pancakeSmartRouter.json')
    factory_abi = require('../../abis/pancake/pancakeSwapFactory.json')


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
        let amount_balance
        let amount_in
        if (token.toUpperCase() === "ETH") {
            amount_balance = await web3.eth.getBalance(this.address_wallet)
            amount_in = parseEther(amountIn)
        } else {
            amount_balance = await erc20.getBalance(from_token, this.address_wallet, web3)
            amount_in = parseUnits(amountIn,6)
        }

        if(amount_in.gt(amount_balance)){
            throw Error('from token balance not enough');
        }

        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);

        let factory_contract = new web3.eth.Contract(this.factory_abi, this.factory_address);

        const pool_address = await factory_contract.methods.getPool(from_token,to_token,'500').call()

        if(pool_address == constants.AddressZero) {
            throw Error(`pool ${from_token} to ${to_token} not exist `);
        }

        const params = {
            tokenIn: from_token,
            tokenOut: to_token,
            fee: '500',
            recipient: this.address_wallet,
            deadline: Math.floor(Date.now() / 1000) + 60 * 10,
            amountIn:amount_in,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0,
        }

        let tx 
        if(token.toUpperCase() === 'ETH')   {    
            // const tx_data = router_contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
            //     0,
            //     [from_token, to_token],
            //     this.address_wallet,
            //     BigNumber.from(Math.floor(Date.now() / 1000)).add(1800),
            //     [true, false]).encodeABI()
            const tx_data = router_contract.methods.exactInputSingle(params).encodeABI()
            tx = {
                nounce: await web3.eth.getTransactionCount(this.address_wallet),
                gasPrice: await web3.eth.getGasPrice(),
                from: this.address_wallet,
                to: this.router_address,
                value: web3.utils.toHex(web3.utils.toWei(amountIn, 'ether')),
                data: tx_data
            };
            //console.log(tx)
        } else {
            await erc20.approve(from_token,this.address_wallet,this.router_address,this.private_key,web3)
            // const tx_data = router_contract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
            //     amount_in,
            //     0,
            //     [from_token, to_token],
            //     this.address_wallet,
            //     BigNumber.from(Math.floor(Date.now() / 1000)).add(1800),
            //     [false, false]).encodeABI()
            // tx = {
            //     nounce: await web3.eth.getTransactionCount(this.address_wallet),
            //     gasPrice: await web3.eth.getGasPrice(),
            //     from: this.address_wallet,
            //     to: this.router_address,
            //     value: 0,
            //     data: tx_data
            // };

            const tx_data = router_contract.methods.exactInputSingle(params).encodeABI()
            tx = {
                nounce: await web3.eth.getTransactionCount(this.address_wallet),
                gasPrice: await web3.eth.getGasPrice(),
                from: this.address_wallet,
                to: this.router_address,
                value: 0,
                data: tx_data
            };         
        } 
        
        let gasLimit = await web3.eth.estimateGas(tx)
        tx['gas'] = gasLimit
        console.log(tx)

    
        let signed_tx = await web3.eth.accounts.signTransaction(tx, this.private_key)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

        const afterBalance = await erc20.getBalance(to_token, this.address_wallet, web3)
        console.debug(`afterBalance: ${afterBalance}`)
        console.log(`Swapped transaction: swap amount:${amountIn} ${from_token} tokens => ${to_token} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    }

}
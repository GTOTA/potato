import { MuteSwitchPair, MuteSwitchPairSettings,ChainId, ETH, USDC, WBTC, EthersProvider } from 'muteswitch-sdk';
import Web3 from 'web3'
import { BigNumber } from "ethers";

import { parseEther, parseUnits, formatUnits, formatEther } from "ethers/lib/utils";
import * as erc20 from '../utils/erc20'

import dotenv from "dotenv";
dotenv.config();

const slippage = 0.005 // 0.5%

export class Mute {
    private_key: string;
    from_token: string;
    to_token: string;
    amount_from: string;
    amount_to: string;
    router_address: string;
    factory_address: string;
    chain_rpc: string;
    address_wallet: string;

    router_abi = require("../../abis/mute/muteswitch-router.json");


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
        let amount_balance,amount_in
        if (token.toUpperCase() === "ETH") {
            amount_balance = await web3.eth.getBalance(this.address_wallet)
            amount_in = parseEther(amountIn)
        } else {
            amount_balance = await erc20.getBalance(from_token, this.address_wallet, web3)
            amount_in = parseUnits(amountIn,6)

        }

        if(BigNumber.from(amount_in).gt(amount_balance)){
            throw Error('from token balance not enough');
        }

        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);

        let tx 
        if(token.toUpperCase() === "ETH")   {
            const tx_data = router_contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
                0,
                [from_token, to_token],
                this.address_wallet,
                BigNumber.from(Math.floor(Date.now() / 1000)).add(1800),
                [true, false]).encodeABI()
            tx = {
                nounce: await web3.eth.getTransactionCount(this.address_wallet),
                gasPrice: await web3.eth.getGasPrice(),
                from: this.address_wallet,
                to: this.router_address,
                value: web3.utils.toHex(web3.utils.toWei(amountIn, 'ether')),
                data: tx_data
            };
        } else {
            const tx_data = router_contract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
                amount_in,
                0,
                [from_token, to_token],
                this.address_wallet,
                BigNumber.from(Math.floor(Date.now() / 1000)).add(1800),
                [false, false]).encodeABI()
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

        let signed_tx = await web3.eth.accounts.signTransaction(tx, this.private_key)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

        const afterBalance = await erc20.getBalance(to_token, this.address_wallet, web3)
        console.debug(`tokenBalance: ${formatUnits(afterBalance, 6)}`)
        console.log(`Swapped transaction: ${amountIn} ${from_token} tokens => ${to_token} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    }

}
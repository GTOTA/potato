import { parseEther, parseUnits, formatUnits, formatEther,Interface} from "ethers/lib/utils";
import { BigNumber } from "ethers";

import Web3 from 'web3';

// load env file
import dotenv from "dotenv";
dotenv.config();


import * as erc20 from '../../src/utils/erc20'



const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const router_abi = require("../../abis/zkswap/router.json");
import { ERA_MAIN } from '../../src/utils/token';


var rpc_url 

export default async function (hre) {

    rpc_url = hre.userConfig.networks?.zkSyncTestnet?.url

    console.log('rpc: ', rpc_url)

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT ZKSYNC-----.`.green)
    console.log(`1. swapEthToUsdc/....`)
    console.log(`2. swapTokenToETH/....`)


    console.log(`0. Exit`)
    var amountIn = process.env.AMOUNT_IN || '0'

    let nameFeature = features.question("Choose your features: ".green);
    switch (nameFeature) {
        case '1': {
            await swapETHToToken(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,amountIn)
            break
        }
        case '2':{
            await swapTokenToETH(ERA_MAIN.usdc_address,ERA_MAIN.weth_address,amountIn)
            break
        } 
        case '0':
            process.exit(0)
        default:
            break;
    }
}

const zkswap_address  = '0x18381c0f738146Fb694DE18D1106BdE2BE040Fa4'


async function getMinAmountOut(web3:Web3,from_token, to_token, amount, slippage) {

    let router_contract = new web3.eth.Contract(router_abi,zkswap_address);
    var min_amount_out = await router_contract.methods.getAmountsOut(
        amount,
        [
           from_token,
           to_token
        ]
    ).call()
    return Math.floor(min_amount_out[1] - (min_amount_out[1] / 100 * slippage))
}

async function swapTokenToETH(from_token,to_token,amountIn) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)
    let before_balance = await erc20.getBalance(from_token,account.address,web3)
    var decimal = await erc20.getDecimals(from_token,web3)
    console.log(`before swap,token_balance:${formatUnits(before_balance,decimal)} eth_balance:${eth_balance}`)


    if(parseUnits(amountIn,decimal).gt(before_balance)) { // 6 for usdc demical
        throw Error('eth_balance not enough');
    }

    const router_address = zkswap_address

    let router_contract = new web3.eth.Contract(router_abi,router_address);

    var slippage = 1 //1% 

    var min_amount_out = await getMinAmountOut(web3,from_token,to_token,parseUnits(amountIn,decimal),slippage)
    console.log(formatEther(min_amount_out))

    const tx_data =  router_contract.methods.swapExactTokensForETH(
        parseUnits(amountIn,decimal),
        min_amount_out,
        [from_token,to_token],
        account.address,
        BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)).encodeABI()
    
    console.log(tx_data)
    
    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value: 0,
        data: tx_data
    };

    await erc20.approve(from_token,account.address,router_address,PRIVATE_KEY,web3)

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)
    

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    eth_balance = await web3.eth.getBalance(account.address)
    before_balance = await erc20.getBalance(from_token,account.address,web3)
    console.log(`after swap,token_balance:${formatUnits(before_balance,decimal)} eth_balance:${eth_balance}`)

    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
} 


async function swapETHToToken(from_token,to_token,amountIn) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)
    let before_balance = await erc20.getBalance(to_token,account.address,web3)
    var decimal = await erc20.getDecimals(to_token,web3)
    console.log(`before swap,token_balance:${formatUnits(before_balance,decimal)} eth_balance:${eth_balance}`)


    if(parseEther(amountIn).gt(eth_balance)) {
        throw Error('eth_balance not enough');
    }

    console.log(`${account.address} tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    const router_address = zkswap_address

    let router_contract = new web3.eth.Contract(router_abi,router_address);

    var slippage = 1 //1% 

    var min_amount_out = await getMinAmountOut(web3,from_token,to_token,parseEther(amountIn),slippage)
    console.log(min_amount_out)

    const tx_data =  router_contract.methods.swapExactETHForTokens(
        min_amount_out,
        [from_token,to_token],
        account.address,
        BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)).encodeABI()
    
    console.log(tx_data)
    
    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(amountIn, 'ether')),
        data: tx_data
    };


    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    //console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    eth_balance = await web3.eth.getBalance(account.address)
    before_balance = await erc20.getBalance(to_token,account.address,web3)
    console.log(`after swap,token_balance:${formatUnits(before_balance,decimal)} eth_balance:${eth_balance}`)

    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);
    return raw_tx_hash
} 






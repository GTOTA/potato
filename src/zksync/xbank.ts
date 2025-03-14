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

const assert = require('assert')

var rpc_url 

export default async function (hre) {

    rpc_url = hre.userConfig.networks?.zkSyncTestnet?.url

    console.log('rpc: ', rpc_url)

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT ZKSYNC-----.`.green)
    console.log(`1. mintXbank/....`)
    console.log(`2. redeemXbank/....`)
    console.log(`3. mintBasilisk/....`)
    console.log(`4. redeemBasilisk/....`)
    console.log(`5. mintReactorfusion/....`)
    console.log(`6. redeemReactorfusion/....`)
    console.log(`7. mintEralend/....`)
    console.log(`8. redeemEralend/....`)

    console.log(`0. Exit`)
    var amountIn = process.env.AMOUNT_IN || ''

    console.log(amountIn)


    let nameFeature = features.question("Choose your features: ".green);
    switch (nameFeature) {
        case '1': {
            await mintXbank(amountIn)
            break
        }
        case '2': {
            await redeemXbank(amountIn)
            break
        }
        case '3': {
            await mintBasilisk(amountIn)
            break
        }
        case '4': {
            await redeemBasilisk(amountIn)
            break
        }
        case '5' :{
            await mintReactorfusion(amountIn)
            break
        }
        case '6' :{
            await redeemReactorfusion(amountIn)
            break
        }  
        case '7' :{
            await mintEralend(amountIn)
            break
        }
        case '8' :{
            await redeemEralend(amountIn)
            break
        }  
        case '0':
            process.exit(0)
        default:
            break;
    }
}

const beth_address  = '0x1e8F1099a3fe6D2c1A960528394F4fEB8f8A288D'

async function mintBasilisk(amountIn) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    assert(parseEther(amountIn).lt(eth_balance),'must lt eth_balance' )

    let before_balance = await erc20.getBalance(beth_address,account.address,web3)

    console.log(`before swap,token_balance:${formatUnits(before_balance,6)}`)

    let ABI = [
        "function mint()"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("mint", [])
    
    console.log(endata)
    
    const tx_data = endata
    
    const router_address = beth_address

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let eth_value = amountIn
    console.log(eth_value)

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)
    

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    let after_balance = await erc20.getBalance(beth_address,account.address,web3)

    console.log(`after mintBasilisk,beth balance:${formatUnits(after_balance,8)}`)
    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
} 


async function redeemBasilisk(amountOut) {
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    //console.log(await web3.eth.getGasPrice())

    let before_balance = await erc20.getBalance(beth_address,account.address,web3)
    console.log(`before swap,token_balance:${formatUnits(before_balance,8)}`)

    let ABI = [
        "function redeem(uint256 amount)"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("redeem", [before_balance])

    console.log(endata)
    
    const tx_data = endata
    
    const router_address = beth_address

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

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    let after_balance = await erc20.getBalance(beth_address,account.address,web3)
    console.log(`after redeemBasilisk,beth balance:${formatUnits(after_balance,8)}`)

    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash

}

const xETH_address = '0xE4622A57Ab8F4168b80015BBA28fA70fb64fa246'

async function mintXbank(amountIn) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    assert(parseEther(amountIn).lt(eth_balance),'must lt eth_balance' )

    console.log(`${account.address} tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    let before_balance = await erc20.getBalance(xETH_address,account.address,web3)
    console.log(`before swap,token_balance:${formatUnits(before_balance,6)}`)

    let ABI = [
        "function mint()"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("mint", [])
    
    console.log(endata)

    const tx_data = endata
    
    const router_address = xETH_address

    const transactionCount = await web3.eth.getTransactionCount(account.address);
    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);


    //const gasPrice = web3.eth.gasPrice.toNumber() * 1.40 

    //const replacement_price = web3.eth.getTransaction(pending_txn_hash).gasPrice * 1.101
    let eth_value = amountIn

    console.log(eth_value)

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    let after_balance = await erc20.getBalance(xETH_address,account.address,web3)
    console.log(`after mintXbank,xeth balance:${formatUnits(after_balance,8)}`)

    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
} 

async function redeemXbank(amountOut) {

    assert(amountOut, 'You must input redeem amount first')
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    //console.log(await web3.eth.getGasPrice())

    let before_balance = await erc20.getBalance(beth_address,account.address,web3)
    console.log(`before swap,token_balance:${formatUnits(before_balance,8)}`)

    let ABI = [
        "function redeemUnderlying(uint256 amount)"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("redeemUnderlying", [parseEther(amountOut)])
    
    const tx_data = endata
    console.log(tx_data)
    
    const router_address = xETH_address

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

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    let after_balance = await erc20.getBalance(xETH_address,account.address,web3)
    console.log(`after redeemXbank,xeth balance:${formatUnits(after_balance,8)}`)

    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash

} 

const rETH = '0xC5db68F30D21cBe0C9Eac7BE5eA83468d69297e6'

async function mintReactorfusion(amountIn) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    assert(parseEther(amountIn).lt(eth_balance),'must lt eth_balance' )

    let lend_token = rETH

    console.log(`${account.address} tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    let before_balance = await erc20.getBalance(lend_token,account.address,web3)

    console.log(`before MINT,token_balance:${formatUnits(before_balance,18)}`)

    let ABI = [
        "function mint()"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("mint", [])
    
    console.log(endata)
    
    const tx_data = endata
    
    const router_address = lend_token

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let eth_value = amountIn
    console.log(eth_value)

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)
    

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    let after_balance = await erc20.getBalance(rETH,account.address,web3)

    console.log(`after mintReactorfusion,beth balance:${formatUnits(after_balance,18)}`)
    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
} 

async function redeemReactorfusion(amountIn) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    let lend_token = rETH

    let before_balance = await erc20.getBalance(lend_token,account.address,web3)

    console.log(`before redeem,token_balance:${formatUnits(before_balance,18)}`)

    let ABI = [
        "function redeem(uint256 redeemTokens)"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("redeem", [before_balance])
    
    console.log(endata)
    
    const tx_data = endata
    
    const router_address = lend_token

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let eth_value = '0'
    console.log(eth_value)

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)
    

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    let after_balance = await erc20.getBalance(lend_token,account.address,web3)

    console.log(`after redeemReactorfusion,beth balance:${formatUnits(after_balance,18)}`)
    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
}


const REALEND_CONTRACT = '0x22D8b71599e14F20a49a397b88c1C878c86F5579'
const REALEND_ABI = require("../../abis/eralend/abi.json");

async function getDepositAmount(user_address) {
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url)) 
    let era_contract = new web3.eth.Contract(REALEND_ABI,REALEND_CONTRACT)
    return await era_contract.methods.balanceOfUnderlying(user_address).call()
}


async function mintEralend(amountIn) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    assert(parseEther(amountIn).lt(eth_balance),'must lt eth_balance' )

    let lend_token = REALEND_CONTRACT

    console.log(`${account.address} tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    let before_balance = await erc20.getBalance(lend_token,account.address,web3)
    var decimal = await erc20.getDecimals(lend_token,web3)

    var deposit_amount = await getDepositAmount(account.address)
    console.log(`before MINT,deposit_amount:${deposit_amount}`)

    let ABI = [
        "function mint()"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("mint", [])
    
    console.log(endata)
    
    const tx_data = endata
    
    const router_address = lend_token

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let eth_value = amountIn
    console.log(eth_value)

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)

    
    

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    let after_balance = await erc20.getBalance(lend_token,account.address,web3)

    console.log(`after mintEralend,eETH balance:${await getDepositAmount(account.address)}`)
    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
} 

async function redeemEralend(amountIn) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before redeemEralend: ${formatUnits(eth_balance, 18)}`)

    let lend_token = REALEND_CONTRACT

    let before_balance = await erc20.getBalance(lend_token,account.address,web3)

    var decimal = await erc20.getDecimals(lend_token,web3)
    console.log(`before redeem,eETHbalance:${formatUnits(before_balance,decimal)}`)

    var deposit_amount = await getDepositAmount(account.address)
    console.log(`before redeem,deposit balance:${deposit_amount}`)

    let ABI = [
        "function redeemUnderlying(uint256 redeemTokens)"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("redeemUnderlying", [deposit_amount])
    
    console.log(endata)
    
    const tx_data = endata
    
    const router_address = lend_token

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let eth_value = '0'
    console.log(eth_value)

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)
    

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    console.log(`after redeemEralend,eETH balance:${await getDepositAmount(account.address)}`)
    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
}
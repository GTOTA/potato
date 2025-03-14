import { parseEther, parseUnits, formatUnits, formatEther } from "ethers/lib/utils";
import { BigNumber } from "ethers";

import Web3 from 'web3';

// load env file
import dotenv from "dotenv";
dotenv.config();


const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


export default async function (hre) {

    let count = 1500

    // RPC结点（兼容 evm 链都行）打哪条链就用哪条链的节点地址
    // eth =>  https://mainnet.infura.io/v3
    // arb => https://arb1.arbitrum.io/rpc
    // polygon => https://polygon-rpc.com
    // op => https://mainnet.optimism.io
    // linea => https://mainnet.infura.io/v3
    // scroll => https://rpc.scroll.io
    // zks => https://mainnet.era.zksync.io
    // fantom => https://rpc.ankr.com/fantom
    // bsc ==> https://bsc-dataseed1.defibit.io
    // avax ==> https://avalanche.blockpi.network/v1/rpc/public


    //https://mct.xyz/nodespeed?chain=BSC

    const url = process.env.NODE_URL
    console.log('rpc: ', url)

    

    for(let i=0 ; i < count; i++) {
        try {
            await inscribePolygen(url)
            //sleep(200)
            console.log(`第 ${i + 1} 次操作成功`);
        }catch (error) {
            console.error(`第 ${i + 1} 次操作失败: `, error);
            sleep(500)
        }
    }

}


async function inscribeLinea(url) {

    const web3 = new Web3(new Web3.providers.HttpProvider(url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    const json_data = 'data:,{"p":"lna-20","op":"mint","tick":"voyage","amt":"10"}'

    const hex_data = web3.utils.toHex(json_data)

    console.log('hex_data:' + hex_data)

    //console.log(await web3.eth.getGasPrice())
    
    const tx_data = hex_data

    const router_address = account.address

    const transactionCount = await web3.eth.getTransactionCount(account.address);
    let price = await web3.eth.getGasPrice()

   let gas_price = web3.utils.toBN(price)
    .mul(web3.utils.toBN(110))
    .div(web3.utils.toBN(100));

    console.log(gas_price.toString)


   // const gasPrice = web3.eth.gasPrice.toNumber() * 1.40 

   //const replacement_price = web3.eth.getTransaction(pending_txn_hash).gasPrice * 1.101

    
    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: gas_price,
        from: account.address,
        to: router_address,
        value: 0,
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    //console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX:  https://lineascan.build/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash

} 

async function inscribePolygen(url) {

    const web3 = new Web3(new Web3.providers.HttpProvider(url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address}  tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    const json_data = 'data:,{"p":"xrs-20","op":"mint","tick":"pook","amt":"1000"}'

    //const hex_data = web3.utils.toHex(json_data)

    //console.log('hex_data:' + hex_data)

    //console.log(await web3.eth.getGasPrice())
    
    //const tx_data = hex_data

    const router_address = '0xF9C4c674188089A7A5C608510360155147b9607b'

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    //212258875993
    //214340458310
    let price = await web3.eth.getGasPrice()

   let gas_price = web3.utils.toBN(price)
    .mul(web3.utils.toBN(110))
    .div(web3.utils.toBN(100));
    
    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: gas_price,
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei('0.1', 'ether')),
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    //console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX:  https://polygonscan.com/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash

} 


async function inscribeZksync(url) {

    const web3 = new Web3(new Web3.providers.HttpProvider(url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    const json_data = 'data:,{"p":"zrc-20","op":"mint","tick":"zksi","amt":"10000"}'

    const hex_data = web3.utils.toHex(json_data)

    console.log('hex_data:' + hex_data)

    //console.log(await web3.eth.getGasPrice())
    
    const tx_data = hex_data

    const router_address = account.address

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    //212258875993
    //214340458310
    let price = await web3.eth.getGasPrice()

   let gas_price = web3.utils.toBN(price)
    .mul(web3.utils.toBN(110))
    .div(web3.utils.toBN(100));
    
    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: gas_price,
        from: account.address,
        to: router_address,
        value: 0,
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    //console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX:  https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash

} 

async function inscribeArb(url) {

    const web3 = new Web3(new Web3.providers.HttpProvider(url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    const json_data = 'data:,{"p":"fair-20","op":"mint","tick":"fair","amt":"1000"}'

    const hex_data = web3.utils.toHex(json_data)

    console.log('hex_data:' + hex_data)

    //console.log(await web3.eth.getGasPrice())
    
    const tx_data = hex_data

    const router_address = account.address

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    //212258875993
    //214340458310
    let price = await web3.eth.getGasPrice()

   let gas_price = web3.utils.toBN(price)
    .mul(web3.utils.toBN(105))
    .div(web3.utils.toBN(100));
    
    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: gas_price,
        from: account.address,
        to: router_address,
        value: 0,
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    //console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX: https://arbiscan.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash

} 


async function inscribeAvax(url) {

    const web3 = new Web3(new Web3.providers.HttpProvider(url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    const json_data = 'data:,{"p":"asc-20","op":"mint","tick":"asct","amt":"2"}'

    const hex_data = web3.utils.toHex(json_data)

    console.log('hex_data:' + hex_data)

    //console.log(await web3.eth.getGasPrice())
    
    const tx_data = hex_data

    const router_address = account.address

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    //212258875993
    //214340458310
    
    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: BigNumber.from(process.env.GAS_VALUE)._hex,
        gasLimit: web3.utils.toHex(21896),
        from: account.address,
        to: router_address,
        value: 0,
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    //console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX: https://snowtrace.io/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash

} 

async function inscribeBsci(url) {

    const web3 = new Web3(new Web3.providers.HttpProvider(url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    const json_data = 'data:,{"p":"bsc-20","op":"mint","tick":"sofi","amt":"4"}'

    const hex_data = web3.utils.toHex(json_data)

    console.log('hex_data:' + hex_data)

    const tx_data = hex_data

    const router_address = account.address


    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: await web3.eth.getGasPrice(),
        gasLimit: web3.utils.toHex(30000),
        from: account.address,
        to: router_address,
        value: 0,
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    //console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX: https://bscscan.com//tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash

} 


async function inscribefantom(url) {

    const web3 = new Web3(new Web3.providers.HttpProvider(url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    const json_data = 'data:,{"p":"frc20","op":"mint","tick":"ftms","amt":"1000"}'

    const hex_data = web3.utils.toHex(json_data)

    //console.log('hex_data:' + hex_data)

    const tx_data = '0x66746d01001800000034746578742f706c61696e3b636861727365743d7574662d387b2270223a226672633230222c226f70223a226d696e74222c227469636b223a2266746d73222c22616d74223a2231303030227d'

    const router_address = '0x062E904fcd616cE80a67a4f6c31B4b27D10e892F'


    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: await web3.eth.getGasPrice(),
        gasLimit: web3.utils.toHex(201492),
        from: account.address,
        to: router_address,
        value: 0,
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    //console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX: https://ftmscan.com/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash

} 

import * as zksync from "zksync-web3";
import * as ethers from "ethers";
import colors from 'colors'
import Web3 from 'web3';


// Currently, only one environment is supported.
import { Wallet, Provider } from "zksync-web3";


// load env file
import dotenv from "dotenv";
dotenv.config();

import { ERA_MAIN } from '../../src/utils/token';


const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";

let wallets = PRIVATE_KEY.split(' ');

var zkSyncProvider;
var zkSyncWallet;
var rpc_url;

export default async function (hre) {
    colors.enable()

    console.log(`start.`)

    rpc_url = hre.userConfig.networks?.zkSyncTestnet?.url

    //let features = require('readline-sync');
    zkSyncProvider = new Provider(hre.userConfig.networks?.zkSyncTestnet?.url);
    zkSyncWallet = new zksync.Wallet(PRIVATE_KEY, zkSyncProvider);

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT ZKSYNC-----.`.green)
    console.log(`1. unwrapWETH/....`)

    console.log(`0. Exit`)
    var amountIn = process.env.AMOUNT_IN || '0'

    let nameFeature = features.question("Choose your features: ".green);
    switch (nameFeature) {
        case '1': {
            await unwrapWETH(amountIn)
            break
        }
        case '2':{
            break
        } 
        case '0':
            process.exit(0)
        default:
            break;
    }

}

async function depositZksync(amountIn,zkSyncWallet) {
    console.log('depostZksync amount:'+amountIn);
    
    const deposit = await zkSyncWallet.deposit({
        token: zksync.utils.ETH_ADDRESS,
        amount: ethers.utils.parseEther(amountIn)
      });


    // Await processing of the deposit on L1
    const ethereumTxReceipt = await deposit.waitL1Commit();

    console.log(`---End ethereumTxReceipt ${ethereumTxReceipt}---.`)

    // Await processing the deposit on zkSync
    const depositReceipt = await deposit.wait();
    // Retrieving the current (committed) zkSync ETH balance of an account
    const committedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS);
    console.log('committedEthBalance:'+ethers.utils.formatEther(committedEthBalance));

    // Retrieving the ETH balance of an account in the last finalized zkSync block.
    const finalizedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS, "finalized");
    console.log('finalizedEthBalance:'+ethers.utils.formatEther(finalizedEthBalance));
    return depositReceipt;

}

async function transferZksync(address2,amountIn,zkSyncWallet){
    const amount = ethers.utils.parseEther(amountIn);

    console.log('transferZksync amount:'+amountIn);
    const transfer = await zkSyncWallet.transfer({
        to: address2,
        token: zksync.utils.ETH_ADDRESS,
        amount,
    });

    // Await commitment
    const committedTxReceipt = await transfer.wait();
    // Await finalization on L1
    const finalizedTxReceipt = await transfer.waitFinalize();

    return committedTxReceipt;
}

async function withdrowZksync(amountIn,zkSyncWallet){
    const amount = ethers.utils.parseEther(amountIn);
    console.log('withdrow amount:'+amountIn);
    const withdrawL2 = await zkSyncWallet.withdraw({
        token: zksync.utils.ETH_ADDRESS,
        amount: amount,
      });

    // Await commitment
    const committedTxReceipt = await withdrawL2.wait();

    return committedTxReceipt;
}

const WETH_ABI =  require("../../abis/weth/weth.json")

async function unwrapWETH(amountIn) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} eth balance before : ${ethers.utils.formatEther(eth_balance)}`)

    let weth_contract = new web3.eth.Contract(WETH_ABI,ERA_MAIN.weth_address);

    console.log(`${account.address} unwrap weth: ${amountIn}`)

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()

    const tx_data =  weth_contract.methods.withdraw(
        ethers.utils.parseEther(amountIn),
       ).encodeABI()

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: ERA_MAIN.weth_address,
        value: 0,
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)
    
    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    eth_balance = await web3.eth.getBalance(account.address)
    console.log(`${account.address} eth balance after : ${ethers.utils.formatEther(eth_balance)}`)

    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

}
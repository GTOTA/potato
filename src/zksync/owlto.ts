import {parseEther,parseUnits ,formatUnits, formatEther} from "ethers/lib/utils";
import { BigNumber } from "ethers";

import Web3 from 'web3'; 

// load env file
import dotenv from "dotenv";
dotenv.config();


// For SELL contract


const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";


const WALLET_ADDRESS = "0xCff4De693fDCDDD00517B3cbE6769CC0C052F770";
if (!WALLET_ADDRESS) 
    throw "⛔️ WALLET_ADDRESS address not provided";


const OwltoFinance_abi = require("../../abis/owlto/OwltoFinance.json")
const OwltoFinance_address = "0xD48e3caf0D948203434646a3f3e80f8Ee18007dc"


// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18


var rpc_url
export default async function (hre) {

    rpc_url = hre.userConfig.networks?.zkSyncTestnet?.url


    //const rpc = 'http://127.0.0.1:8011'
    console.log('rpc: ', rpc_url)

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    console.log(hre.userConfig.networks?.zkSyncTestnet?.url)

    const account =  web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log('eth_balance:'+eth_balance)


    let router_contract = new web3.eth.Contract(OwltoFinance_abi,OwltoFinance_address);

    const formatData =
    (input) => {
        if (input > 9) {
            return input;
        } else return `0${input}`;
    };

    var date = new Date()
    var format_date = date.getFullYear()+''+formatData(date.getMonth()+1) +formatData(date.getDate())
    console.log(format_date)

    const tx_data =  router_contract.methods.checkIn(format_date).encodeABI()

    console.log(tx_data)
    const transactionCount = await web3.eth.getTransactionCount(account.address);
    let gas_price = await web3.eth.getGasPrice()

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: web3.utils.toHex(gas_price),
        from:  account.address,
        to: OwltoFinance_address,
        value: 0,
        data:tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '') 

   
    console.log(`OwltoFinance sign in : ${account.address} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);
   
}
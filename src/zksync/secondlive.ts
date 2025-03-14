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


const SecondLiveAbi = require("../../abis/secondlive/SecondLiveFactory.json")
const secondlive_address = "0x6cC6305eD7bBeaA7C2Fa84E4a3b78743Cb5B1A08"



export default async function (hre) {

    const rpc = 'https://mainnet.era.zksync.io'

    //const rpc = 'http://127.0.0.1:8011'
    console.log('rpc: ', rpc)

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc))

    console.log(hre.userConfig.networks?.zkSyncTestnet?.url)

    const account =  web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log('eth_balance:'+eth_balance)

    let tradingamount =  '0.001';

    if(parseEther(tradingamount).gt(eth_balance)) {
        console.log('insuffient balance:'+tradingamount)
        return
    }

    let router_contract = new web3.eth.Contract(SecondLiveAbi,secondlive_address);

    const formatData =
    (input) => {
        if (input > 9) {
            return input;
        } else return `0${input}`;
    };

    var date = new Date()
    var format_date = date.getFullYear()+''+formatData(date.getMonth()+1) +formatData(date.getDate())
    console.log(format_date)
    const tx_data =  router_contract.methods.signIn(format_date).encodeABI()

    console.log(tx_data)
    const transactionCount = await web3.eth.getTransactionCount(account.address);
    let gas_price = await web3.eth.getGasPrice()

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: web3.utils.toHex(gas_price),
        from:  account.address,
        to: secondlive_address,
        value: 0,
        data:tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit


    console.log(tx)
    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '') 

   
    console.log(`secondlive sign in : ${account.address} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);
   
}
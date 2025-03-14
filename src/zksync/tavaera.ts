
import { parseEther, parseUnits, formatUnits, formatEther,Interface} from "ethers/lib/utils";
import { BigNumber } from "ethers";

import Web3 from 'web3';

// load env file
import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

var rpc_url 

export default async function (hre) {

    rpc_url = hre.userConfig.networks?.zkSyncTestnet?.url

    console.log('rpc: ', rpc_url)

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT ZKSYNC-----.`.green)
    console.log(`1. mintTAVAERA_ID/....`)


    console.log(`0. Exit`)
    var amountIn = process.env.AMOUNT_IN || '0'

    let nameFeature = features.question("Choose your features: ".green);
    switch (nameFeature) {
        case '1': {
            await mintTAVAERA_ID()
            break
        }
        case '2':{     
        } 
        case '0':
            process.exit(0)
        default:
            break;
    }
}

const TAVAERA_ID_CONTRACT = '0xd29Aa7bdD3cbb32557973daD995A3219D307721f'
const TAVAERA_ID_ABI = require("../../abis/tavaera/id.json");

async function  mintTAVAERA_ID()
{
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

  

    console.log(`mint:${account.address}  tevaera id `)

    let mint_contract = new web3.eth.Contract(TAVAERA_ID_ABI,TAVAERA_ID_CONTRACT)

    const tx_data =  mint_contract.methods.mintCitizenId().encodeABI()
    
    console.log(tx_data)

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()

    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice:  price,
        from: account.address,
        to: TAVAERA_ID_CONTRACT,
        value:  web3.utils.toHex(web3.utils.toWei('0.0003', 'ether')),
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

}











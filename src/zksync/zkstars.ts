
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

const router_abi = require("../../abis/zkstars/router.json");

const contracts = [
    "0xe7Ed1c47E1e2eA6e9126961df5d41798722A7656",
    "0x53424440d0ead57e599529b42807a0ba1965dd66",
    "0x406b1195f4916b13513fea102777df5bd4af06eb",
    "0xf19b7027d37c3321194d6c5f34ea2e6cbc73fa25",
    "0xd834c621dea708a21b05eaf181115793eaa2f9d9",
    "0xafec8df7b10303c3514826c9e2222a16f1486bee",
    "0x56bf83e598ce80299962be937fe0ba54f5d5e2b2",
    "0x8595d989a96cdbdc1651e3c87ea3d945e0460097",
    "0x945b1edcd03e1d1ad9255c2b28e1c22f2c819f0e",
    "0xc92fc3f19645014c392825e3cfa3597412b0d913",
    "0x808d59a747bfedd9bcb11a63b7e5748d460b614d",
    "0x8dd8706cbc931c87694e452caa0a83a564753241",
    "0x8dd3c29f039e932ebd8eac873b8b7a56d17e36c6",
    "0xca0848cadb25e6fcd9c8ce15bcb8f8da6c1fc519",
    "0x06d52c7e52e9f28e3ad889ab2083fe8dba735d52",
    "0x86f39d51c06cac130ca59eabedc9233a49fcc22a",
    "0xee0d4a8f649d83f6ba5e5c9e6c4d4f6ae846846a",
    "0xfda7967c56ce80f74b06e14ab9c71c80cb78b466",
    "0x0d99efcde08269e2941a5e8a0a02d8e5722403fc",
    "0xf72cf790ac8d93ee823014484fc74f2f1e337bf6"
]

var rpc_url 

export default async function (hre) {

    rpc_url = hre.userConfig.networks?.zkSyncTestnet?.url

    console.log('rpc: ', rpc_url)

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT ZKSYNC-----.`.green)
    console.log(`1. mintZkstars/....`)


    console.log(`0. Exit`)
    var amountIn = process.env.AMOUNT_IN || '0'

    let nameFeature = features.question("Choose your features: ".green);
    switch (nameFeature) {
        case '1': {
            await mintZkstars(contracts)
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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function  mintZkstars(contracts)
{
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let mint_index = getRandomInt(0, contracts.length-1)

    let contract_address = contracts[mint_index]

    console.log(`mint:${contract_address}zkstars nft`)

    let mint_contract = new web3.eth.Contract(router_abi,contract_address)

    let nft_id = await mint_contract.methods.name().call()
    let mint_price = await mint_contract.methods.getPrice().call()

    console.info(`${account.address} Mint ${nft_id} NFT ${mint_price} `)

    const tx_data =  mint_contract.methods.safeMint(
        Web3.utils.toChecksumAddress('0x739815d56A5FFc21950271199D2cf9E23B944F1c')).encodeABI()
    
   
    console.log(tx_data)

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    let gas_price = web3.utils.toBN(price)
    .mul(web3.utils.toBN(110))
    .div(web3.utils.toBN(100));
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: gas_price,
        from: account.address,
        to: contract_address,
        value: mint_price,
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

}











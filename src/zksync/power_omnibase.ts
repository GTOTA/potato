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

var rpc_url 

export default async function (hre) {

    rpc_url = hre.userConfig.networks?.zkSyncTestnet?.url

    console.log('rpc: ', rpc_url)

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT ZKSYNC-----.`.green)
    console.log(`1. bridgeNFT/....`)



    console.log(`0. Exit`)
    var msg = process.env.MESSAGE
    var dstChain = process.env.DEST

    var nft_id

    let nameFeature = features.question("Choose your features: ".green);
    switch (nameFeature) {
        case '1': {
            nft_id = await mintNFT()
            console.log(`after mint ${nft_id}, waiting 200ms for briging NFT to ${dstChain}`)
            sleep(200)
            await bridgeNFT(dstChain,nft_id)
            break
        }
        case '3': {
            //await BridgeNFT(nft_id)
            break
        }
        
       
        case '0':
            process.exit(0)
        default:
            break;
    }
}


const L2TELEGRAPH_NFT_CONTRACT = '0xD43A183C97dB9174962607A8b6552CE320eAc5aA'
const l2tele__abi = require("../../abis/l2tele/send_message.json")
const L2TELEGRAPH_MSG_ADDRESS = "0x0d4a6d5964f3b618d8e46bcfbf2792b0d769fbda"



const CANTO_CHAINID = 165
const CANTO_MSG_DESTINATION= '0x5b10ae182c297ec76fe6fe0e3da7c4797cede02d0d4a6d5964f3b618d8e46bcfbf2792b0d769fbda'
const CANTO_NFT_DESTINATION= ''

const NOVA_CHAINID = 175
const NOVA_MSG_DESTINATION= '0x5f26ea1e4d47071a4d9a2c2611c2ae0665d64b6d0d4a6d5964f3b618d8e46bcfbf2792b0d769fbda'
const NOVA_NFT_DESTINATION= '0x5b10ae182c297ec76fe6fe0e3da7c4797cede02dd43a183c97db9174962607a8b6552ce320eac5aa'

const OP_BNB_CHAINID = 202
const OP_BNB_MSG_DESTINATION= '0xdc60fd9d2a4ccf97f292969580874de69e6c326e0d4a6d5964f3b618d8e46bcfbf2792b0d769fbda'
const OP_BNB_NFT_DESTINATION= '0x64e0f6164ac110b67df9a4848707ffbcb86c87a9d43a183c97db9174962607a8b6552ce320eac5aa'

const chain_ids = {
    "OP_BNB": {'chain_id':OP_BNB_CHAINID,'msg_destination':OP_BNB_MSG_DESTINATION,'nft_destination':OP_BNB_NFT_DESTINATION},
    "ARB_NOVA":{'chain_id':NOVA_CHAINID,'msg_destination':NOVA_MSG_DESTINATION,'nft_destination':NOVA_NFT_DESTINATION}
}

async function getEstimateFee(web3:Web3,user_address,contract_address,destChainId){

    let l2_contract = new web3.eth.Contract(l2tele__abi,contract_address);
    let fee = await l2_contract.methods.estimateFees(
        destChainId,
        user_address,
        "0x",
        false,
        "0x"
    ).call()

    return Math.floor(fee[0] * 1.1)
}


async function mintNFT() {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before mint: ${formatUnits(eth_balance, 18)}`)


    let ABI = [
        "function mint()"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("mint",[])
    
    console.log(endata)
    
    const tx_data = endata
    
    const router_address = L2TELEGRAPH_NFT_CONTRACT

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value:  web3.utils.toHex(web3.utils.toWei('0.0005', 'ether')),
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)
    
    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    console.log(`${account.address}  TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    var receipts = await web3.eth.getTransactionReceipt(raw_tx_hash.transactionHash)        
    var nft_id = parseInt(web3.utils.toHex(receipts["logs"][2]["topics"][3])) 

    console.log(nft_id)

    return nft_id
}




async function bridgeNFT(dstChain,nftId) {

    if(!nftId) return
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before mint: ${formatUnits(eth_balance, 18)}`)


    let ABI = [
        " function crossChain(uint16 destChainId, bytes _destination,uint256 nftId)"
    ];

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("crossChain",[chain_ids[dstChain].chain_id, chain_ids[dstChain].nft_destination,nftId])
    
    console.log(endata)
    
    const tx_data = endata
    
    const router_address = L2TELEGRAPH_NFT_CONTRACT

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let l0_fee = await getEstimateFee(web3,account.address,L2TELEGRAPH_NFT_CONTRACT,chain_ids[dstChain].chain_id)

    console.log(`l0_fee ${formatEther(l0_fee)} ETH`);

    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value:  web3.utils.toHex(l0_fee),
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)
    
    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    console.log(`${account.address}  TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

}






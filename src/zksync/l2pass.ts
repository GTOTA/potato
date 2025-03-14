import { parseEther, parseUnits, formatUnits, formatEther,Interface} from "ethers/lib/utils";
import { BigNumber } from "ethers";

import * as check from '../../src/utils/check'
 

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
    console.log(`-----MENU RUN SCRIPT ZKSYNC odos-----.`.green)
    console.log(`1. L2PASS mintNFT/....`)
    console.log(`2. bridgeNFT/....`)

    console.log(`0. Exit`)
    var dstChain = process.env.DEST

    var nft_id = process.env.NFT_ID || 0

    let nameFeature = features.question("Choose your features: ".green);

    switch (nameFeature) {
        case '1': {
            nft_id = await mintNFT()
            console.log(`after mint ${nft_id}, waiting 200ms for briging NFT to ${dstChain}`)
            sleep(200)
            break
        }
        case '2': {
            await bridgeNFT(dstChain,nft_id)
            break
        }    
       
        case '0':
            process.exit(0)
        default:
            break;
    }
}


const L2PASS_NFT_CONTRACT = '0x8582525114212C2815F13d96Ed5158553287a166'
const LZPASS_ADAPTER_PARAMS = '0x00010000000000000000000000000000000000000000000000000000000000030d40'
const LZPASS_ZROPAYMENT_ADDRESS = '0x0000000000000000000000000000000000000000'

const NOVA_CHAINID = 175
const KAVA_CHAINID = 177


const chain_ids = {
    "KAVA": {'chain_id':KAVA_CHAINID},
    "ARB_NOVA":{'chain_id':NOVA_CHAINID}
}



async function getMintPrice(web3:Web3) {
    let ABI = [
        "function mintPrice()"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("mintPrice",[])
    
    console.log(endata)
 
    const result = await web3.eth.call({
        to: L2PASS_NFT_CONTRACT, 
        data: endata
    });
    return result
}


async function getEstimateFee(web3:Web3,user_address,destChainId,nftId){

    let ABI = [
        "function estimateSendFee(uint16 _dstChainId,bytes _toAddress, uint256 _tokenId, bool _useZro,bytes _adapterParams)"
    ];

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("estimateSendFee",[destChainId,user_address,nftId,true,LZPASS_ADAPTER_PARAMS])
    
    const result = await web3.eth.call({
        to: L2PASS_NFT_CONTRACT, 
        data: endata
    });
    return parseInt(result.substring(0,66))
}



async function mintNFT() {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before mint: ${formatUnits(eth_balance, 18)}`)

    let ABI = [
        "function mint(uint256 n)"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("mint",[1])
    
    console.log(endata)
    
    const tx_data = endata
    
    const router_address = L2PASS_NFT_CONTRACT

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()

    check.checkGasFee(price)

    let mint_price = await getMintPrice(web3)

    //check.checkGasFee(mint_price)

    //console.log(`L2 mint_price ${formatEther(mint_price)} gasPrice  ${formatEther(price)} ETH`);


    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: router_address,
        value:  web3.utils.toHex(mint_price),
        data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    //console.log(tx)
    
    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    console.log(`${account.address}  TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    var receipts = await web3.eth.getTransactionReceipt(raw_tx_hash.transactionHash)    
    //console.log(receipts["logs"])    
    var nft_id = parseInt(web3.utils.toHex(receipts["logs"][2]["topics"][3])) 

    console.log(nft_id)

    return nft_id
}




async function bridgeNFT(dstChain,nftId) {

    if(!nftId || !dstChain) return
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before mint: ${formatUnits(eth_balance, 18)}`)


    let ABI = [
        " function sendFrom(address _from, uint16 _dstChainId, bytes _toAddress, uint256 _tokenId, address _refundAddress, address _zroPaymentAddress, bytes _adapterParams)"
    ];

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("sendFrom",[
                                            account.address,
                                            chain_ids[dstChain].chain_id, 
                                            account.address, 
                                            nftId,
                                            account.address,
                                            LZPASS_ZROPAYMENT_ADDRESS,
                                            LZPASS_ADAPTER_PARAMS])
    
    //console.log(endata)
    
    const tx_data = endata
    
    const router_address = L2PASS_NFT_CONTRACT

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    check.checkGasFee(price)

    let l0_fee = await getEstimateFee(web3,account.address,chain_ids[dstChain].chain_id,nftId)

    check.checkLoFee(l0_fee)

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

    

    //console.log(tx)
    
    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    console.log(`${account.address}  TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

}






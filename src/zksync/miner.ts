import { parseEther, parseUnits, formatUnits, formatEther,Interface} from "ethers/lib/utils";
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
    console.log(`1. miner refuel/....`)

    console.log(`0. Exit`)
    var dstChain = process.env.DEST

    var nft_id

    let nameFeature = features.question("Choose your features: ".green);

    switch (nameFeature) {
        case '1': {
            await refuel('METER','0.00001')
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


const MINER_GAS_CONTRACT = '0x5673B6e6e51dE3479B8deB22dF46B12308db5E1e'
const MINER_NFT_CONTRACT = '0x5673B6e6e51dE3479B8deB22dF46B12308db5E1e'
const MINER_ADAPTER_PARAMS = '0x00020000000000000000000000000000000000000000000000000000000000030d40000000000000000000000000000000000000000000000000000009184e72a000ca14d9a1c37523cc616462ce1ba241ccdbe5e336'
const MINER_ZROPAYMENT_ADDRESS = '0x0000000000000000000000000000000000000000'

const METER_CHAINID = 176

const NOVA_CHAINID = 175
const KAVA_CHAINID = 177


const chain_ids = {
    "KAVA": {'chain_id':KAVA_CHAINID},
    "ARB_NOVA":{'chain_id':NOVA_CHAINID},
    "METER":{'chain_id':METER_CHAINID}
}



async function getMintPrice(web3:Web3) {
    let ABI = [
        "function mintPrice()"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("mintPrice",[])
    
    console.log(endata)
 
    const result = await web3.eth.call({
        to: MINER_NFT_CONTRACT, 
        data: endata
    });
    return result
}


const l2tele__abi = require("../../abis/l2tele/send_message.json")


// async function getEstimateFee(web3:Web3,user_address,contract_address,destChainId){

//     let l2_contract = new web3.eth.Contract(l2tele__abi,contract_address);
//     let fee = await l2_contract.methods.estimateFees(
//         destChainId,
//         user_address,
//         "0x",
//         false,
//         "0x"
//     ).call()

//     console.log(fee)

//     return Math.floor(fee[0] * 1.1)
// }


async function getEstimateFee(web3:Web3,contract_address,destChainId,payload){

    let ABI = [
        "function estimateSendFee(uint16 _dstChainId,bytes payload,bytes _adapterParams)"
    ];

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("estimateSendFee",[destChainId,contract_address,MINER_ADAPTER_PARAMS])
    
    const result = await web3.eth.call({
        to: contract_address, 
        data: endata
    });

    return parseInt(result.substring(0,66))
}



async function refuel(dstChain,amountIn) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before mint: ${formatUnits(eth_balance, 18)}`)

    let ABI = [
        "function bridgeGas(uint16 _dstChainId, bytes _toAddress, bytes _adapterParams)"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("bridgeGas",[chain_ids[dstChain].chain_id,account.address,MINER_ADAPTER_PARAMS])
    
    //console.log(endata)

    const tx_data = endata
    
    const router_address = MINER_GAS_CONTRACT

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()

    check.checkGasFee(price)

    let l0_fee = await getEstimateFee(web3,MINER_GAS_CONTRACT,chain_ids[dstChain].chain_id,'')

    check.checkLoFee(l0_fee)

    console.log(`l0 fee ${formatEther(l0_fee)} ETH`)

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

    var receipts = await web3.eth.getTransactionReceipt(raw_tx_hash.transactionHash)    
    //console.log(receipts["logs"])    
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
        " function sendFrom(address _from, uint16 _dstChainId, bytes _toAddress, uint256 _tokenId, address _refundAddress, address _zroPaymentAddress, bytes _adapterParams)"
    ];

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("sendFrom",[
                                            account.address,
                                            chain_ids[dstChain].chain_id, 
                                            account.address, 
                                            nftId,
                                            account.address])
    
    //console.log(endata)
    
    const tx_data = endata
    
    const router_address = MINER_NFT_CONTRACT

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);

    let l0_fee = await getEstimateFee(web3,account.address,chain_ids[dstChain].chain_id,'')
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






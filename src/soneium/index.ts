import colors from 'colors'
import Web3 from 'web3'
import { BigNumber } from "ethers";
import { getBalance } from '../../src/utils/erc20'
import { parseEther, parseUnits, formatUnits, formatEther, Interface, Bytes, formatBytes32String, parseBytes32String } from "ethers/lib/utils";


// load env file
// import dotenv from "dotenv";
// dotenv.config();
colors.enable()

require('dotenv').config();


const stringRandom = require('string-random');

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY!;
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const rpc_url = 'http://rpc.soneium.org'

const ADD_PRICE = false

async function getGASPrice() {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))
    const price = await web3.eth.getGasPrice()
    const gasPrice = ADD_PRICE ? BigNumber.from(price).mul(120).div(100) : BigNumber.from(price)

    // console.log(`getGASPrice  ${formatEther(gasPrice)} ETH`);
    return gasPrice.toHexString()
}


const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)
const SeaDrop_address = '0x0000000000000068F116a894984e2DB1123eB395'

async function mint_venari_container() {

    const router_address = SeaDrop_address
    const nftContract= '0x702241c23f1add928C286E65b9e4ADC993481702'
    const feeRecipient = '0x0000a26b00c1F0DF003000390027140000fAa719'
    const minterIfNotPayer = '0x0000000000000000000000000000000000000000'
    const quantity=1
    //const mintParams = [0,0,0,0,0,0,0,true]

    const mintParams = {
        mintPrice : 0,           // 第一个参数: "0"
        maxTotalMintableByWallet: 1,           // 第二个参数: "1"
        startime:  BigNumber.from(Math.floor(Date.now() / 1000)),  // 第三个参数: 开始时间戳
        endTime: BigNumber.from(Math.floor(Date.now() / 1000)).add(1800),  // 第四个参数: 结束时间戳
        dropStageIndex: 1,           // 第五个参数: "1"
        maxTokenSupplyForStage: 5000,        // 第六个参数: "5000"
        feeBps: 1000,        // 第七个参数: "1000"
        restrictFeeRecipients: true    
    }

    const salt = BigNumber.from('77673629865857632358712525509373995880108080195735509551545088461678646315856')
    const bytes = '0xe7e8d961bf0645c5baf67f48d4b8cd941e59fce267c9774794cdce9b5a104bb85ef9f5a00a2e796e7773cc845a28461a037cbee1c3035652d3360659c6a825661c'

    console.log(salt.toHexString())

    let ABI = [
        "function mintSigned(address nftContract, address feeRecipient, address minterIfNotPayer, uint256 quantity, (uint256 mintPrice,uint256 maxTotalMintableByWallet,uint256 startime,uint256 endTime,uint256 dropStageIndex,uint256 maxTokenSupplyForStage,uint256 feeBps,bool restrictFeeRecipients) mintParams, uint256 salt, bytes signature)"
    ];
    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("mintSigned", [nftContract, feeRecipient,minterIfNotPayer,quantity,mintParams,salt,bytes])

    const tx_data = endata

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let eth_value = '0'
    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: await getGASPrice(),
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: tx_data
    };

    console.log(tx)

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit
    return

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address} process_claim TX: https://soneium.blockscout.com/tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
}


export default async function(){
    await mint_venari_container()
}


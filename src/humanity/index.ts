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

const rpc_url = 'https://rpc.testnet.humanity.org'

const ADD_PRICE = false

async function getGASPrice() {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))
    const price = await web3.eth.getGasPrice()
    const gasPrice = ADD_PRICE ? BigNumber.from(price).mul(120).div(100) : BigNumber.from(price)

    // console.log(`getGASPrice  ${formatEther(gasPrice)} ETH`);
    return gasPrice.toHexString()
}


const huamnity_abi = require("./abi/humanity.json");
const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)
const humanity_address = '0xa18f6FCB2Fd4884436d10610E69DB7BFa1bFe8C7'


async function claim_reward() {
    let eth_balance = await web3.eth.getBalance(account.address)

    console.log(`${account.address} tokenBalance before: ${formatUnits(eth_balance, 18)}`)

    //console.log(await web3.eth.getGasPrice())

    const router_contract = new web3.eth.Contract(huamnity_abi,humanity_address);

    const sender_address = account.address;

    const genesis_claimed = await router_contract.methods.userGenesisClaimStatus(sender_address).call()
    const current_epoch = await router_contract.methods.currentEpoch().call()
    const {buffer_amount, claim_status} = await router_contract.methods.userClaimStatus(sender_address, current_epoch).call()


    if(genesis_claimed && !claim_status ) {
        console.log(`claim is enabled for ${sender_address} ${buffer_amount}`)
        await process_claim(router_contract)
    }else {
        console.log(`claim is disabled for ${sender_address} ${buffer_amount} `)

    } 
}

async function process_claim(router_contract) {
    const transactionCount = await web3.eth.getTransactionCount(account.address);

    const tx_data =  router_contract.methods.claimReward().encodeABI()

    let eth_value = '0'
    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: await getGASPrice(),
        from: account.address,
        to: humanity_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: tx_data
    };

    console.log(tx)

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit


    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address} process_claim TX:  https:///tx/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
}


export default async function(){
    await claim_reward()
}


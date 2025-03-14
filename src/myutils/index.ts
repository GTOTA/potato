import colors from 'colors'
import Web3 from 'web3'
import { BigNumber } from "ethers";
import { parseEther, parseUnits, formatUnits, formatEther, Interface, Bytes, formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { types } from 'util';


// load env file
// import dotenv from "dotenv";
// dotenv.config();
colors.enable()

require('dotenv').config();

const ERC20ABI = require("../../abis/erc-20.json")

const stringRandom = require('string-random');

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY!;
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";


const ADD_PRICE = true

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFloat(min, max) {
    return (Math.random() * (max - min) + min).toFixed(3);
}

async function getGASPrice(web3:Web3) {

    const price = await web3.eth.getGasPrice()
    const gasPrice = ADD_PRICE ? BigNumber.from(price).mul(120).div(100) : BigNumber.from(price)

    // console.log(`getGASPrice  ${formatEther(gasPrice)} ETH`);
    return gasPrice.toHexString()
}

export async function getDecimals(web3: Web3 ,tokenAddress : string) {
    const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
    return tokenContract.methods.decimals().call()
}


export async function getBalance(web3:Web3,token: string, _address: string) {

    let ABI = [
        "function balanceOf(address spender)"
    ]

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("balanceOf", [_address])

    const result = await web3.eth.call({
        to: token,
        data: endata
    });

    console.log(`token:${token} , spender: ${_address} balance ${formatEther(result)}`);
    return result
}


export async function approveToken(web3: Web3,fromAddress: string, token: string, spender: string, amount:BigNumber) {


    try {
        let ABI = [
            "function approve(address spender,uint256 value)"
        ]

        let iface = new Interface(ABI);
        var endata = iface.encodeFunctionData("approve", [spender, amount])

        let tx = {
            nounce: await web3.eth.getTransactionCount(fromAddress),
            gasPrice: await getGASPrice(web3),
            from: fromAddress,
            to: token,
            value: 0,
            data: endata,
            gas: 0
        };

        let gasLimit = await web3.eth.estimateGas(tx)
        tx['gas'] = gasLimit

        let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
        return raw_tx_hash

    } catch (e) {
        throw e
    }
}


export async function sendTx(web3:Web3,fromAddress:string, toAddress:string, sendValue:string, txData:string){

    let tx = {
        nounce: await web3.eth.getTransactionCount(fromAddress),
        gasPrice: await getGASPrice(web3),
        from: fromAddress,
        to: toAddress,
        value: sendValue,
        data: txData,
        gas: 0
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)


    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    return raw_tx_hash
    //console.log(`TX: ${explorer}/${raw_tx_hash.transactionHash}`);
}
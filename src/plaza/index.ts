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


const rpc_url = 'https://sepolia.base.org/'

const ADD_PRICE = true

async function getGASPrice() {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))
    const price = await web3.eth.getGasPrice()
    const gasPrice = ADD_PRICE ? BigNumber.from(price).mul(120).div(100) : BigNumber.from(price)

    // console.log(`getGASPrice  ${formatEther(gasPrice)} ETH`);
    return gasPrice.toHexString()
}


const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)
const contract_address = '0xF39635F2adF40608255779ff742Afe13dE31f577'

const bondToken = '0x5Bd36745f6199CF32d2465Ef1F8D6c51dCA9BdEE'
const usdc_token = '0xf7464321dE37BdE4C03AAeeF6b1e7b71379A9a64'
const wst_token = '0x13e5FB0B6534BB22cBC59Fae339dbBE0Dc906871'
const lev_token = '0x98f665D98a046fB81147879eCBE9A6fF68BC276C'


const couponeToken = usdc_token


const explorer = ' https://sepolia.basescan.org/tx'

async function getBalance(token: string, spender: string) {

    let ABI = [
        "function balanceOf(address spender)"
    ]

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("balanceOf", [spender])

    const result = await web3.eth.call({
        to: token,
        data: endata
    });

    console.log(`token:${token} , spender: ${spender} balance ${formatEther(result)}`);

    return result

}


async function approveToken(token: string, spender: string, amount) {

    try {
        let ABI = [
            "function approve(address spender,uint256 value)"
        ]

        let iface = new Interface(ABI);
        var endata = iface.encodeFunctionData("approve", [spender, amount])

        let tx = {
            nounce: await web3.eth.getTransactionCount(account.address),
            gasPrice: await getGASPrice(),
            from: account.address,
            to: token,
            value: 0,
            data: endata
        };

        let gasLimit = await web3.eth.estimateGas(tx)
        tx['gas'] = gasLimit

        let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
        console.log(`approve token:${token} , spender: ${spender} ,amount: ${amount} TX: ${explorer}/${raw_tx_hash.transactionHash}`);

    } catch (e) {
        throw e
    }
}

async function swapBondETHByUSDC(amount) {

    const router_address = '0x809daBC75201F92AC40973f22db37995676BaA04'

    let ABI = [
        "function swapCreate(address _pool,address depositToken,uint8 tokenType,uint256 depositAmount,uint256 minAmount)"
    ];

    const tokenType = 0;
    const depositAmount = parseEther(amount);
    console.log(amount)
    const minAmount = 0

    const poolAddress = '0xF39635F2adF40608255779ff742Afe13dE31f577'
    const depositToken = usdc_token

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("swapCreate", [poolAddress, depositToken, tokenType, depositAmount, minAmount])

    try {
        await approveToken(usdc_token, router_address, depositAmount)
    } catch (e) {
        console.log('approve token error' + e)
        return
    }

    let eth_value = '0'
    let tx = {
        nounce: await web3.eth.getTransactionCount(account.address),
        gasPrice: await getGASPrice(),
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: endata
    };

    console.log(tx)

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX: ${explorer}/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
}

async function swapLevETHByUSDC(amount) {

    const router_address = '0x809daBC75201F92AC40973f22db37995676BaA04'

    let ABI = [
        "function swapCreate(address _pool,address depositToken,uint8 tokenType,uint256 depositAmount,uint256 minAmount)"
    ];

    const tokenType = 1;
    const depositAmount = parseEther(amount);
    console.log(amount)
    const minAmount = 0

    const poolAddress = '0xF39635F2adF40608255779ff742Afe13dE31f577'
    const depositToken = usdc_token

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("swapCreate", [poolAddress, depositToken, tokenType, depositAmount, minAmount])

    try {
        await approveToken(usdc_token, router_address, depositAmount)
    } catch (e) {
        console.log('approve token error' + e)
        return
    }

    let eth_value = '0'
    let tx = {
        nounce: await web3.eth.getTransactionCount(account.address),
        gasPrice: await getGASPrice(),
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: endata
    };

    console.log(tx)

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX: ${explorer}/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
}

async function swapBondETHByWst(amount) {

    const router_address = '0xF39635F2adF40608255779ff742Afe13dE31f577'

    let ABI = [
        "function create(uint8 tokenType,uint256 depositAmount,uint256 minAmount)"
    ];

    console.log(amount)
    const tokenType = 0;
    const depositAmount = parseEther(amount);
    const minAmount = parseEther((parseFloat(amount) * 20.7) + '')
    //const minAmount = '0x24e0b7f3356ca806'

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("create", [tokenType, depositAmount, minAmount])

    try {
        await approveToken(wst_token, router_address, depositAmount)
    } catch (e) {
        console.log('approve token error' + e)
        return
    }

    let eth_value = '0'

    let tx = {
        nounce: await web3.eth.getTransactionCount(account.address),
        gasPrice: await getGASPrice(),
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: endata
    };

    console.log(tx)

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit


    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX: ${explorer}/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
}

async function redeemBondETH2Wst(amount) {

    const router_address = contract_address

    let ABI = [
        "function redeem(uint8 tokenType,uint256 depositAmount,uint256 minAmount)"
    ];

    const tokenType = 0;
    const depositAmount = parseEther(amount);
    const minAmount = parseEther(Math.floor(parseFloat(amount) * 0.03) + '')

    //getOraclePrice()

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("redeem", [tokenType, depositAmount, minAmount])

    try {
        await approveToken(bondToken, router_address, depositAmount)
    } catch (e) {
        console.log('approve token error' + e)
        return
    }

    let eth_value = '0'
    let tx = {
        nounce:  await web3.eth.getTransactionCount(account.address),
        gasPrice: await getGASPrice(),
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: endata
    };

    console.log(tx)

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX: ${explorer}/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
}

async function redeemLevETH2Usdc(amount) {

    const router_address = '0x809daBC75201F92AC40973f22db37995676BaA04'

    let ABI = [
        "function swapRedeem(address _pool,address redeemToken,uint8 tokenType,uint256 depositAmount,uint256 minAmount)"
    ];

    const tokenType = 1;
    const depositAmount = parseEther(amount);
    console.log(amount)
    const minAmount = 0

    const poolAddress = '0xF39635F2adF40608255779ff742Afe13dE31f577'
    const redeemToken = usdc_token

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("swapRedeem", [poolAddress, redeemToken,tokenType, depositAmount, minAmount])

    try {
        await approveToken(lev_token, router_address, depositAmount)
    } catch (e) {
        console.log('approve token error' + e)
        return
    }

    let eth_value = '0'
    let tx = {
        nounce:  await web3.eth.getTransactionCount(account.address),
        gasPrice: await getGASPrice(),
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: endata
    };

    console.log(tx)

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address} redeemLevETH2Usdc levETH ${amount}  TX: ${explorer}/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
}

async function claimCoupon() {

    const router_address = '0xb01866F195533dE16EB929b73f87280693CA0cB4'

    let ABI = [
        "function claim()"
    ];

    let iface = new Interface(ABI);
    var endata = iface.encodeFunctionData("claim", [])

    let eth_value = '0'
    let tx = {
        nounce:  await web3.eth.getTransactionCount(account.address),
        gasPrice: await getGASPrice(),
        from: account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(eth_value, 'ether')),
        data: endata
    };

    console.log(tx)

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address} claim TX: ${explorer}/${raw_tx_hash.transactionHash}`);

    return raw_tx_hash
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomFloat(min, max) {
    return (Math.random() * (max - min) + min).toFixed(3);
};


export default async function () {

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT PLAZA-----.`.green)
    console.log(`1. swapBondETHByUSDC....`)
    console.log(`2. swapBondETHByWST....`)
    console.log(`3. redeemBondETH....`)
    console.log(`4. claimCoupon....`)
    console.log(`5. swapLevETHByUSDC....`)
    console.log(`6. redeemLevETH....`)
    console.log(`0. Exit`)


    const usdc_balance = await getBalance(usdc_token,account.address)
    const wst_balance = await getBalance(wst_token,account.address)
    const bond_balance = await getBalance(bondToken,account.address)
    const lev_balance = await getBalance(lev_token,account.address)

    let nameFeature = features.question("Choose your features: ".green);

    switch (nameFeature) {
        case '1': {
            const usdc_amount = getRandomInt(1, parseInt(formatEther(usdc_balance))*0.1) + ''
            await swapBondETHByUSDC(usdc_amount)
            break
        }
        case '2': {
            const wst_amount = getRandomFloat(0, parseFloat(formatEther(wst_balance))*0.2) + ''
            await swapBondETHByWst(wst_amount)
            break
        }
        case '3': {
            const bond_amount = getRandomFloat(0, parseFloat(formatEther(bond_balance))*0.1) + ''
            await redeemBondETH2Wst(bond_amount)
            break
        }
        case '4': {
            await claimCoupon()
            break
        }
        case '5': {
            const usdc_amount = getRandomInt(1, parseInt(formatEther(usdc_balance))*0.1) + ''
            await swapLevETHByUSDC(usdc_amount)
            break
        }
        case '6': {
            const lev_amount = getRandomFloat(0, parseFloat(formatEther(lev_balance))*0.1) + ''
            await redeemLevETH2Usdc(lev_amount)
            break
        }
        default:
            process.exit(0)
    }


}


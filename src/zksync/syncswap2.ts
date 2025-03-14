import {parseEther,parseUnits ,formatUnits, formatEther} from "ethers/lib/utils";
import * as ethers from "ethers";

import { BigNumber } from "ethers";

import Web3 from 'web3'; 

// load env file
import dotenv from "dotenv";
dotenv.config();


// For SELL contract
const ERC20ABI = require("../../abis/erc-20.json")
const factory_abi = require("../../abis/syncswap/SyncSwapClassicPoolFactory.json")
const pool_abi = require("../../abis/syncswap/SyncSwapClassicPool.json")
const router_abi = require("../../abis/syncswap/SyncSwapRouter.json");

const ZERO_ADDRESS = ethers.constants.AddressZero;



const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";


const WALLET_ADDRESS = "0xCff4De693fDCDDD00517B3cbE6769CC0C052F770";
if (!WALLET_ADDRESS) 
    throw "⛔️ WALLET_ADDRESS address not provided";

const factory_address = "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb"
const router_address = "0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295"

//const Web3 = require('Web3')

async function approve(tokAddress : string, myAddress : string, spender : string, web3: Web3 ){
    const tokenContract = new web3.eth.Contract(ERC20ABI, tokAddress);
    let nounce = await web3.eth.getTransactionCount(myAddress);
    const tokenBalance = await tokenContract.methods.balanceOf(myAddress).call()
    let data = await tokenContract.methods.approve(spender, tokenBalance).encodeABI();
    let gasPrice = await web3.eth.getGasPrice();

    const gasLimit = 2100000;
    let tx = {
        nounce,
        gasPrice,
        gasLimit,
        to: tokAddress,
        value: 0,
        data
    };
    const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);

    const signtx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction || '');
    //console.log('tx: ', signtx);
}

export default async function (hre) {

    const rpc = 'http://127.0.0.1:8011'
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

    let router_contract = new web3.eth.Contract(router_abi,router_address);

    let usdc_token = "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4"
    let usdt_token = "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C"
    let from_token = '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91'
    let to_token = usdc_token
  
    let factory_contract = new web3.eth.Contract(factory_abi,factory_address);

    let pool_address = await factory_contract.methods.getPool(from_token, to_token).call()

    // Checks whether the pool exists.
    if (pool_address === ZERO_ADDRESS) {
        throw Error('Pool not exists');
    }

    const pool_contract = new web3.eth.Contract(pool_abi,pool_address);

    let lp_Balance = await pool_contract.methods.balanceOf(account.address).call();

    console.log("lp_balance before:"+formatEther(lp_Balance));

    const swapData = ethers.utils.defaultAbiCoder.encode(
        ["address"],
        [ account.address], 
    );

    let callback = ZERO_ADDRESS
    let  min_liquidity = 0

    let amountIn = parseEther(tradingamount)

    const liquid_tx_data =  router_contract.methods.addLiquidity2(
        pool_address,
        [
            {
                token: to_token, 
                amount: 0
            },
            {
                token: callback, 
                amount: amountIn
            }
        ],
        swapData,
        min_liquidity,
        callback,
        '0x').encodeABI()

    const transactionCount = await web3.eth.getTransactionCount(account.address);
    const gas_price = await web3.eth.getGasPrice();

    let liquid_tx = {
        nounce: transactionCount,
        gasPrice: gas_price,
        from:  account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(tradingamount, 'ether')),
        data:liquid_tx_data
    }

    liquid_tx['gas'] = await web3.eth.estimateGas(liquid_tx)

    let signed_tx = await web3.eth.accounts.signTransaction(liquid_tx, PRIVATE_KEY)
    let raw_tx_hash 
    //raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '') 
    //lp_Balance = await pool_contract.methods.balanceOf(account.address).call();
    //console.log(`wallet ${account.address} is Added ${formatEther(lp_Balance)} tokens to liquidity pool on Syncswap | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)   


    //removeliquidity for eth/usdc, first appove the pool lp token
    await approve(pool_address,account.address,router_address,web3)

    const minAmounts = [0,0]

    const liquidity = BigNumber.from(lp_Balance).mul(BigNumber.from(50)).div(BigNumber.from(100))

    console.log(formatEther(liquidity))

    const liquidData = ethers.utils.defaultAbiCoder.encode(
        [ "address", "uint8"],
        [ account.address, 1], // tokenIn, to, withdraw mode
    );
  

    const reliquid_tx_data =  router_contract.methods.burnLiquidity(
        pool_address,
        liquidity,
        liquidData,
        minAmounts,
        callback,
        '0x').encodeABI()


    console.log(reliquid_tx_data)

    let reliquid_tx = {
        nounce: await web3.eth.getTransactionCount(account.address),
        gasPrice: gas_price,
        from:  account.address,
        to: router_address,
        value:0,
        data:reliquid_tx_data
    }

    //reliquid_tx['gas'] = await web3.eth.estimateGas(reliquid_tx)

    reliquid_tx['gas'] = 2470000

  
    signed_tx = await web3.eth.accounts.signTransaction(reliquid_tx, PRIVATE_KEY)
    raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '') 
    lp_Balance = await pool_contract.methods.balanceOf(account.address).call();
    console.log(`wallet ${account.address} remove ${formatEther(lp_Balance)} tokens from liquidity pool on Syncswap | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)   

}
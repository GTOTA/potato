import {parseEther,parseUnits ,formatUnits, formatEther} from "ethers/lib/utils";
import { BigNumber } from "ethers";

import Web3 from 'web3'; 

// load env file
import dotenv from "dotenv";
dotenv.config();


// For SELL contract
const ERC20ABI = require("../../abis/erc-20.json")
const SpaceFiRouterAbi = require("../../abis/spacefi/spacefi_swap_router.json")
const classicPoolFactoryAbi = require("../../abis/spacefi/factory.json")
const classicPool = require("../../abis/spacefi/classic_pool.json")



const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";


const WALLET_ADDRESS = "0xCff4De693fDCDDD00517B3cbE6769CC0C052F770";
if (!WALLET_ADDRESS) 
    throw "⛔️ WALLET_ADDRESS address not provided";


const space_address = "0x47260090cE5e83454d5f05A0AbbB2C953835f777"
const router_address = "0xbE7D1FD1f6748bbDefC4fbaCafBb11C6Fc506d1d"
const factory_address = "0x0700Fb51560CfC8F896B2c812499D17c5B0bF6A7"

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

    let tradingamount =  '0.006';

    if(parseEther(tradingamount).gt(eth_balance)) {
        console.log('insuffient balance:'+tradingamount)
        return
    }

    let router_contract = new web3.eth.Contract(SpaceFiRouterAbi,router_address);

    let usdc_token = "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4"
    let usdt_token = "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C"
    let from_token = '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91'
    let to_token = usdc_token
    const transactionCount = await web3.eth.getTransactionCount(account.address);
    const tokenContract = new web3.eth.Contract(ERC20ABI, to_token);
    const tokenBalance = await tokenContract.methods.balanceOf(account.address).call()
    console.log(`tokenBalance before: ${formatUnits(tokenBalance,6)}`)

    const tx_data =  router_contract.methods.swapExactETHForTokens(
        0,
        [from_token,to_token],
        account.address,
        BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)).encodeABI()
      
    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: web3.utils.toHex(web3.utils.toWei('2.5', 'gwei')),
        gasLimit: web3.utils.toHex(2100000),
        from:  account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(tradingamount, 'ether')),
        data:tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)

    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash 
    //=await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '') 

    const afterBalance = await tokenContract.methods.balanceOf(account.address).call()
    console.log(`tokenBalance: ${formatUnits(afterBalance.toString(),6)}`)
    //console.log(`Swapped transaction: ${tradingamount} ${from_token} tokens => ${to_token} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    let factory_contract = new web3.eth.Contract(classicPoolFactoryAbi,factory_address);

    let pair = await factory_contract.methods.getPair(from_token,to_token).call()

    let pair_contract = new web3.eth.Contract(classicPool,pair);


    // Sorts the reserves by token addresses.
    //const [reserveETH, reserveErc20] = from_token < to_token ? reserves : [reserves[1], reserves[0]];

    let amountOut = await router_contract.methods.getAmountsOut(parseEther(tradingamount),[from_token,to_token]).call();

    console.log(formatEther(amountOut[0]))

    console.log(`amountOut: ${formatUnits(amountOut[1],6)}`)

    await approve(to_token,account.address,router_address,web3)

    const liquid_tx_data =  router_contract.methods.addLiquidityETH(
        to_token,
        amountOut[1],
        0,
        0,
        account.address,
        BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)).encodeABI()
      
    let liquid_tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: web3.utils.toHex(web3.utils.toWei('2.5', 'gwei')),
        from:  account.address,
        to: router_address,
        value: web3.utils.toHex(web3.utils.toWei(tradingamount, 'ether')),
        data:liquid_tx_data
    };

    liquid_tx['gas'] = await web3.eth.estimateGas(liquid_tx)

    signed_tx = await web3.eth.accounts.signTransaction(liquid_tx, PRIVATE_KEY)
    raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '') 
    console.log(`Added ${tradingamount} tokens to liquidity pool on SpaceFI | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)

    //before removeLiquidity, we must approve lp_token for router , else error "Unable to estimate gas for the request with our suggested gas limit of 83896436. The transaction is most likely unexecutable. Breakdown of estimation"
    await approve(pair,account.address,router_address,web3)

    const lp_Balance = await pair_contract.methods.balanceOf(account.address).call();

    console.log(formatEther(lp_Balance))

    const liquidity = BigNumber.from(lp_Balance).mul(BigNumber.from(50)).div(BigNumber.from(100))

    console.log(formatEther(liquidity))


    const reliquid_tx_data =  router_contract.methods.removeLiquidity(
        from_token,
        to_token,
        liquidity,
        0,
        0,
        account.address,
        BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)).encodeABI()
      
    let reliquid_tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: web3.utils.toHex(web3.utils.toWei('2.5', 'gwei')),
        from:  account.address,
        to: router_address,
        value: 0,
        data:reliquid_tx_data
    };

    reliquid_tx['gas'] = await web3.eth.estimateGas(reliquid_tx)
    signed_tx = await web3.eth.accounts.signTransaction(reliquid_tx, PRIVATE_KEY)
    raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '') 


    console.log(formatEther(await pair_contract.methods.balanceOf(account.address).call()))
    const toBalance = await tokenContract.methods.balanceOf(account.address).call()

    console.log(`after remove lp,toBalance balance: ${formatUnits(toBalance.toString(),6)}`)

    console.log(`remove ${formatEther(liquidity)} tokens from liquidity pool on SpaceFI | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)

}
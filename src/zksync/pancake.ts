import { solidityPack, parseEther,parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";

import * as zksync from "zksync-web3";
import * as ethers from "ethers";

const smartRouterAbi = require('../../abis/pancake/pancakeSmartRouter.json')
const smartRouterAddress = '0xf8b59f3c3Ab33200ec80a8A58b2aA5F5D2a8944C'

const factoryAbi = require('../../abis/pancake/pancakeSwapFactory.json')
const factoryAddress = '0x1BB72E0CbbEA93c08f535fc7856E0338D7F7a8aB'


const wethAbi = require('../../abis/pancake/weth.json')
const wethAddress = '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91'

const usdcAbi = require('../../abis/erc-20.json')
const usdcAddress = '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4'


// load env file
import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";


const WALLET_ADDRESS = "0xCff4De693fDCDDD00517B3cbE6769CC0C052F770";
if (!WALLET_ADDRESS) 
    throw "⛔️ WALLET_ADDRESS address not provided";


export default async function (hre) {

    const provider = new zksync.Provider(hre.userConfig.networks?.zkSyncTestnet?.url);

    console.log(hre.userConfig.networks?.zkSyncTestnet?.url)
    const factoryContract = new zksync.Contract(factoryAddress, factoryAbi, provider)

    const poolAddress = await factoryContract.getPool(wethAddress, usdcAddress, '500')
    console.log('poolAddress', poolAddress)

    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    const wethContract = new zksync.Contract(wethAddress, wethAbi, provider)
    const usdcContract = new zksync.Contract(usdcAddress, usdcAbi, provider)

    const amountIn = ethers.utils.parseUnits('0.001', '18')

    await wethContract.connect(signer).approve(smartRouterAddress, amountIn.toString())
    console.log('approved!')

    const smartRouterContract = new zksync.Contract(smartRouterAddress, smartRouterAbi, provider)

    const params = {
        tokenIn: wethAddress,
        tokenOut: usdcAddress,
        fee: '500',
        recipient: signer.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
        amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    }

    let wethBalance
    let usdcBalance
    wethBalance = await wethContract.balanceOf(signer.address)
    usdcBalance = await usdcContract.balanceOf(signer.address)
    console.log('================= BEFORE SWAP')
    console.log('wethBalance:', ethers.utils.formatUnits(wethBalance.toString(), 18))
    console.log('usdcBalance:', ethers.utils.formatUnits(usdcBalance.toString(), 6))

    const tx = await smartRouterContract.connect(signer).exactInputSingle(
        params,
        {
            value: amountIn,
            gasLimit: 2000000       
        }
    );
    await tx.wait()

    wethBalance = await wethContract.balanceOf(signer.address)
    usdcBalance = await usdcContract.balanceOf(signer.address)
    console.log('================= AFTER SWAP')
    console.log('wethBalance:', ethers.utils.formatUnits(wethBalance.toString(), 18))
    console.log('usdcBalance:', ethers.utils.formatUnits(usdcBalance.toString(), 6))
}

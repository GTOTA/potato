import { MuteSwitchPair, MuteSwitchPairSettings,ChainId, ETH, USDC, WBTC, EthersProvider } from 'muteswitch-sdk';
import * as zksync from "zksync-web3";
import { Contract, utils, Provider } from "zksync-web3";
import * as ethers from "ethers";


import { HardhatRuntimeEnvironment } from "hardhat/types";

// load env file
import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";

if (!PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

// Address of the contract on zksync testnet
const CONTRACT_ADDRESS = "0xB1E6079212888f0bE0cf55874B2EB9d7a5e02cD9";

if (!CONTRACT_ADDRESS) throw "⛔️ Contract address not provided";


//const factory = "0xCc05E242b4A82f813a895111bCa072c8BBbA4a0e"
//const router = "0x96c2Cf9edbEA24ce659EfBC9a6e3942b7895b5e8"
//const multicall = "0xd9Ee4c1e04059D4B0dd02b747282511bEE4E5fB5"


//const path = [USDC.ZKSYNC_ERA().contractAddress, WBTC.ZKSYNC_ERA().contractAddress]
const path = ['0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91','0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4']

//const path = ['0x0faF6df7054946141266420b43783387A78d82A9', '0x20b28B1e4665FFf290650586ad76E977EAb90c5D']

const to = '0xCff4De693fDCDDD00517B3cbE6769CC0C052F770'

const slippage = 0.005 // 0.5%

const factory = "0x40be1cBa6C5B47cDF9da7f963B6F761F4C60627D"
const router = "0x8B791913eB07C32779a16750e3868aA8495F5964"
const multicall = "0xb1F9b5FCD56122CdfD7086e017ec63E50dC075e7"

const ROUTER_ABI = require("../abi/mute/muteswitch-router.json");


//async trade(amount: string): Promise<TradeContext>;
const ERC20ABI = require("../../abis/erc-20.json")

async function approvalToken(wallet,tokenaddress){
    const erc20Contract = new ethers.Contract(tokenaddress, ERC20ABI, wallet);
    var wallet_address =  await wallet.getAddress();
    var balance = await erc20Contract.balanceOf(wallet_address);
    console.log(' balance of usdc:'+ ethers.utils.formatUnits(balance, 18));

    let allowance = await erc20Contract.allowance(wallet_address, router)
    console.log(`Waiting transaction approval: ${wallet_address} allowance: ${allowance}`);

    if (allowance.lte(balance)) {
        console.log("-----------approve-------------")
        let res = await erc20Contract.approve(router, balance)
        return res.wait()
    }
}

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
    console.log(`Running script to interact with contract ${CONTRACT_ADDRESS}`);

    const provider = new ethers.providers.StaticJsonRpcProvider(" https://mainnet.era.zksync.io");
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    var balance = await signer.getBalance();
    console.log(' balance before swap:'+ ethers.utils.formatEther(balance));

    //const erc20Token = new ethers.Contract('0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91', ERC20ABI, provider);
    //var weth = await erc20Token.balanceOf(to);
    //console.log( ethers.utils.formatEther(weth))

    var amountIn = '0.0011' // 0.0005 ETH

    const muteswitchPair = new MuteSwitchPair({
                // the contract address of the token you want to convert FROM
                fromTokenContractAddress: path[0],
                // the contract address of the token you want to convert TO
                toTokenContractAddress: path[1],
                // the ethereum address of the user using this part of the dApp
                ethereumAddress: to,
                // you can pass in the provider url as well if you want
                ethereumProvider: provider,
                // using custom provider url instead
                //providerUrl: YOUR_PROVIDER_URL,
                settings: new MuteSwitchPairSettings({
                        slippage: slippage,
                        customNetwork: {
                         multicallContractAddress: multicall,
                        }
                    }),
                });

    console.log('create pair'+ ETH.ZKSYNC_ERA().contractAddress);
    // now to create the factory you just do
    const muteswitchPairFactory = await muteswitchPair.createFactory();

    var trade = await muteswitchPairFactory.trade(amountIn);

    // subscribe to quote changes
    trade.quoteChanged$.subscribe((value: TradeContext) => {
    // value will hold the same info as below but obviously with
    // the new trade info.
    });

    console.log(trade);
    if(!trade.fromBalance.hasEnough) {
        console.log('fromBalance has not enough!!!');
        //return;
    }

    //example sending tx via web3 provider 
    var routerContract = new Contract(router, ROUTER_ABI, signer);

    //const amount = ethers.utils.parseEther(amountIn);

    console.log('create swapExactETHForTokensSupportingFeeOnTransferTokens'+amountIn);


    var tx = await routerContract.swapExactETHForTokensSupportingFeeOnTransferTokens(
        1635214, trade.routePath, to, 
                    ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), [true,false], 
                    { 
                        value: ethers.utils.parseEther(amountIn),
                        gasLimit: 800000,
                        //gasPrice: ethers.utils.parseUnits('0.25', 'gwei')  
                    }
                    )

  
    console.log(tx);
    console.log(`Transaction to change the message is ${tx.hash}`);
    // destroy object once finished
    trade.destroy();
}





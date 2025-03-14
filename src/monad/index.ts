import colors from 'colors'
import Web3 from 'web3'
import { parseEther, parseUnits, formatUnits, formatEther, Interface, Bytes, formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { sendTx, approveToken, getDecimals, getBalance, sleep, getRandomInt, getRandomFloat } from '../utils'
import dotenv from 'dotenv'
import axios from 'axios'
import { MonadUniswap } from './uniswap';

colors.enable()
dotenv.config();

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY!;
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";

const EXPLORER_URL = "https://testnet.monadexplorer.com/tx/"
const RPC_URL = "https://testnet-rpc.monad.xyz/"
//RPC_URL = "https://monad-testnet.drpc.org/" 

const TOKENS = {
    "native": "native",  //MON
    "DAK": "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
    "YAKI": "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
    "CHOG": "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
}


export default async function () {

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT -----.`.green)
    console.log(`1. swap MON to DAK....`)
    console.log(`2. swap DAK to MON....`)
    console.log(`0. Exit`)


    const monadSwap = new MonadUniswap(PRIVATE_KEY, '127.0.0.1', RPC_URL);


    while (true) {

        const monAmount = formatEther(await monadSwap.getBalance('native'))
        console.log(monAmount)
        const dakAmount = await monadSwap.getBalance('DAK')
        console.log(formatEther(dakAmount))

        let nameFeature = features.question("Choose your features: ".green)

        switch (nameFeature) {
            case '1': {
                const inAmount = getRandomFloat(0.001, parseFloat(monAmount) * 0.003) + ''
                const res = await monadSwap.getUniswapQuote('bob', 'native', inAmount, 'DAK', 50)
                break
            }
            case '2': {
                const inAmount = getRandomFloat(1, parseFloat(dakAmount) * 0.1) + ''
                const res = await monadSwap.getSwapQuote('bob', 'DAK', inAmount, 'native', 50)
                break
            }
            case '3': {
                break;
            }
            default:
                process.exit(0)
        }
    }
}






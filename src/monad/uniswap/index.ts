import Web3 from 'web3'
import axios from 'axios'

import { parseEther, parseUnits, formatUnits, formatEther, Interface, Bytes, formatBytes32String, parseBytes32String } from "ethers/lib/utils";

import { sendTx, approveToken, getDecimals, getBalance, sleep, getRandomInt, getRandomFloat } from '../../utils'

const { SocksProxyAgent } = require('socks-proxy-agent');

const TOKENS = {
    "native": "native",  //MON
    "DAK": "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
    "YAKI": "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
    "CHOG": "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
}

export class MonadUniswap {
    privateKey: string;
    web3: Web3;
    address: string;
    proxy: string;

    constructor(privateKey: string, proxy: string, rpc_url: string) {
        this.privateKey = privateKey
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))
        this.address = this.web3.eth.accounts.privateKeyToAccount(privateKey).address
        this.proxy = proxy
    }

    async getBalance(token) {
        if (token == 'native') {
            return await this.web3.eth.getBalance(this.address)
        } else {
            return await getBalance(this.web3, TOKENS[token], this.address)
        }
    }

    socksProxyAgent = new SocksProxyAgent('socks5://127.0.0.1:1080');

    async getUniswapQuote(chain: string, inToken: string, inAmount: string, outToken: string, slippage: number) {

        console.log(`swap ${inAmount} ${inToken} to ${outToken}  in  ${chain}`)
        const quote_url = 'https://trading-api-labs.interface.gateway.uniswap.org/v1/quote'
        const quoteParmas ={
            "amount": "10000000000000000",
            "gasStrategies": [
                {
                    "limitInflationFactor": 1.15,
                    "displayLimitInflationFactor": 1.15,
                    "priceInflationFactor": 1.5,
                    "percentileThresholdFor1559Fee": 75,
                    "minPriorityFeeGwei": 2,
                    "maxPriorityFeeGwei": 9
                }
            ],
            "swapper": "0xE3d449A08DF5d4f3C0d49b13C3FBDE61F65Dd114",
            "tokenIn": "0x0000000000000000000000000000000000000000",
            "tokenInChainId": 10143,
            "tokenOut": "0xfe140e1dce99be9f4f15d657cd9b7bf622270c50",
            "tokenOutChainId": 10143,
            "type": "EXACT_INPUT",
            "urgency": "normal",
            "protocols": [
                "V2"
            ],
            "autoSlippage": "DEFAULT"
        }
        //swap 
        const config = {
            headers: {
                "authority":'trading-api-labs.interface.gateway.uniswap.org',
                "origin":'https://app.uniswap.org',
                "refer":'https://app.uniswap.org/',
                "accept": "*/*",
                "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-TW;q=0.6,zh;q=0.5",
                "content-type": "application/json",
                "priority": "u=1, i",
                "sec-ch-ua": '"Google Chrome";v="133", "Chromium";v="133", "Not_A Brand";v="96"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Macos"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                'user-agent': "Mozilla\/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/133.0.0.0 Safari\/537.36",
            },
            httpsAgent: this.socksProxyAgent

        };

        const res = await axios.post(quote_url, quoteParmas, config);
        console.log(res)
        return res;
    }

    async getSwapQuote(chain: string, inToken: string, inAmount: string, outToken: string, slippage: number) {

        console.log(`swap ${inAmount} ${inToken} to ${outToken}  in  ${chain}`)
        let quote_url = ''
        if (inToken == 'native') {
            //swap MON to DAK
            quote_url = 'https://uniswap.api.dial.to/swap/confirm?chain=' + chain
                + '&inputCurrency=' + TOKENS[inToken] + '&outputCurrency=' + TOKENS[outToken]
                + '&inputSymbol=MON&outputSymbol=' + outToken + '&inputDecimals=18&'
                + 'outputDecimals=18&amount={' + inAmount + '}'
        }
        else {
            //swap DAK to MON
            quote_url = 'https://uniswap.api.dial.to/swap/confirm?chain=' + chain
                + '&inputCurrency=' + TOKENS[inToken] + '&outputCurrency=' + TOKENS[outToken]
                + '&inputSymbol=' + outToken + '&outputSymbol=MON&inputDecimals=18&'
                + 'outputDecimals=18&amount={' + inAmount + '}'
        }


        const swapParmas = {
            "account": this.address,
            "type": "transaction"
        }
        //swap 
        const config = {
            headers: {
                "accept": "*/*",
                "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-TW;q=0.6,zh;q=0.5",
                "content-type": "application/json",
                "priority": "u=1, i",
                "sec-ch-ua": '"Google Chrome";v="120", "Chromium";v="120", "Not_A Brand";v="24"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Macos"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                'user-agent': "Mozilla\/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/133.0.0.0 Safari\/537.36",
            }

        };

        const res = await axios.post(quote_url, swapParmas, config);
        console.log(res.data)
        return res;
    }
}



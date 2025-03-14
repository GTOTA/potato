import { sendTx, approveToken, getDecimals, getBalance } from '../utils/'
import colors from 'colors'
import Web3 from 'web3'
import { BigNumber } from "ethers";
import { parseEther, parseUnits, formatUnits, formatEther, Interface, Bytes, formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import axios from 'axios'


colors.enable()

require('dotenv').config();


const stringRandom = require('string-random');

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY!;
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";

const randomUseragent = require('random-useragent');
const { HttpsProxyAgent } = require('https-proxy-agent');

const authority = 'https://canoe.v2.icarus.tools'
const origin_url = 'https://oku.trade'

const rpc_url = 'https://bob-mainnet.public.blastapi.io'
const explorer = 'https://explorer.gobob.xyz/tx/'
const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

class Oku {
    name: string;
    address: any;
    clientKey: any;
    websiteUrl: any;
    headers: any;
    UniversaRouterContract = '0x346239972d1fa486FC4a521031BC81bFB7D6e8a4'
    UniswapV3Pool = '0x2eCe0e4b20ab662A9fc222A391b3CCB9ebf0485d'
    Permit2 = '0xCbe9Be2C87b24b063A21369b6AB0Aa9f149c598F'
    USDT = '0x05D032ac25d322df992303dCa074EE7392C117b9'
    USDC = '0xe75D0fB2C24A55cA1e3F96781a2bCC7bdba058F0'

    constructor(address: string, proxy: string) {
        this.name = 'oku';
        this.address = address;        //this.agent = new HttpsProxyAgent(proxy);
        this.headers = {
            'authority': authority,
            'Content-Security-Policy': 'referrer no-referrer-when-downgrade strict-origin-when-cross-origin',
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9',
            'cache-control': 'no-cache',
            'content-type': 'application/json;charset=UTF-8',
            'origin': origin_url,
            'pragma': 'no-cache',
            'referer': origin_url,
            'user-agent': "Mozilla\/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/133.0.0.0 Safari\/537.36",
        }
    }

    async getSwapQuote(chain: string, inAddress: string, inAmount: string, outAddress: string, slippage: number) {

        const url = 'https://canoe.v2.icarus.tools/market/usor/swap_quote'

        const data = {
            account: this.address,
            chain: chain,
            inTokenAddress: inAddress,
            inTokenAmount: inAmount,
            isExactIn: true,
            outTokenAddress: outAddress,
            slippage: slippage
        };
        const config = {
            headers: this.headers,

        };

        const res = await axios.post(url, data, config);
        return res;
    }

    async swapByUniswap(chain: string, fromToken: string, inAmount: string, toToken: string, slippage: number, contractAddress: string, sendValue: string) {

        try {
            const decimal = await getDecimals(web3, fromToken)
            const tx = await approveToken(web3, account.address, fromToken, this.Permit2, parseUnits(inAmount, decimal))
            console.log(`TX: ${explorer}/${tx.transactionHash}`);
        } catch (e) {
            console.log('approve token error' + e)
            return
        }

        try {
            const res = await this.getSwapQuote(chain, fromToken, inAmount, toToken, slippage)
            const txData = res.data.candidateTrade['data']
            const raw_tx_hash = await sendTx(web3, account.address, contractAddress, sendValue, txData)
            console.log(`TX: ${explorer}/${raw_tx_hash.transactionHash}`);
        } catch (e) {
            console.log('swap token error' + e)
            return
        }

    }
}

export default async function () {

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT -----.`.green)
    console.log(`1. swap usdt to usdc....`)
    console.log(`2. swap usdc to usdt....`)
    console.log(`0. Exit`)

    const oku = new Oku(account.address, '127.0.0.1');


    while (true) {

        console.log(formatEther(await web3.eth.getBalance(account.address)))
        console.log(formatEther(await web3.eth.getBalance(account.address)))


        let nameFeature = features.question("Choose your features: ".green);


        switch (nameFeature) {
            case '1': {
                const res = await oku.swapByUniswap('bob', oku.USDT, '0.1', oku.USDC, 50, oku.UniversaRouterContract, '0')
                break
            }
            case '2': {
                const res = await oku.swapByUniswap('bob', oku.USDC, '0.1', oku.USDT, 50, oku.UniversaRouterContract, '0')

                break
            }
            case '3': {
                break;
            }
            case '4': {
                break
            }
            case '5': {

                break
            }
            case '6': {

                break
            }
            default:
                process.exit(0)
        }
    }
}



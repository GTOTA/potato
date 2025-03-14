import { parseEther, parseUnits, formatUnits, formatEther,Interface} from "ethers/lib/utils";
import { BigNumber } from "ethers";

import Web3 from 'web3';

// load env file
import dotenv from "dotenv";
dotenv.config();


import * as erc20 from '../../src/utils/erc20'



const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const router_abi = require("../../abis/zkswap/router.json");
import { ERA_MAIN } from '../../src/utils/token';


var rpc_url:string 

export default async function (hre) {

    rpc_url = hre.userConfig.networks?.zkSyncTestnet?.url

    console.log('rpc: ', rpc_url)

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT ZKSYNC odos-----.`.green)
    console.log(`1. swapEthToUsdc/....`)
    console.log(`2. swapTokenToETH/....`)

    console.log(`0. Exit`)
    var amountIn = process.env.AMOUNT_IN || '0'

    let nameFeature = features.question("Choose your features: ".green);
    switch (nameFeature) {
        case '1': {
            await swapToken(ERA_MAIN.eth_address,ERA_MAIN.weth_address,amountIn)
            break
        }
        case '2':{
            await swapToken(ERA_MAIN.usdc_address,ERA_MAIN.eth_address,amountIn)
            break
        } 
        case '0':
            process.exit(0)
        default:
            break;
    }
}

const router_address  = '0x4bBa932E9792A2b917D47830C93a9BC79320E4f7'


async function getQuote(user_address,from_token, to_token, amount_in, slippage) {
    const quoteUrl = 'https://api.odos.xyz/sor/quote/v2';

    const quoteRequestBody = {
      chainId: ERA_MAIN.chain_id, // Replace with desired chainId
      inputTokens: [
        {
            tokenAddress: Web3.utils.toChecksumAddress(from_token), // checksummed input token address
            amount: amount_in, // input amount as a string in fixed integer precision
        }
      ],
      outputTokens: [
        {
            tokenAddress: Web3.utils.toChecksumAddress(to_token) ,// checksummed output token address
            proportion: 1
        }
      ],
      userAddr: Web3.utils.toChecksumAddress(user_address), // checksummed user address
      slippageLimitPercent: slippage, // set your slippage limit percentage (1 = 1%),
      referralCode: 0, // referral code (recommended)
      disableRFQs: true,
      compact: true,
    };
    
    const response = await fetch(
      quoteUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteRequestBody),
      });
    
    if (response.status === 200) {
      const quote = await response.json();
      return quote
      // handle quote response data
    } else {
      console.error('Error in Quote:', response); 
      // handle quote failure cases
    } 
}

async function getAssembleTranction(user_address, path_id) {
    const assembleUrl = 'https://api.odos.xyz/sor/assemble';

    const assembleRequestBody = {
      userAddr: user_address, // the checksummed address used to generate the quote
      pathId: path_id, // Replace with the pathId from quote response in step 1
      simulate: false, // this can be set to true if the user isn't doing their own estimate gas call for the transaction
    };
    
    const response = await fetch(
      assembleUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assembleRequestBody),
      });
    
    if (response.status === 200) {
        const assembledTransaction = await response.json();
        return assembledTransaction
      // handle Transaction Assembly response data
        
    } else {
      console.error('Error in Transaction Assembly:', response);
      // handle quote failure cases
    }
}

async function get_token_balance(token:string,user_address:string,web3:Web3) {
    let token_balance
    if (token != ERA_MAIN.eth_address) {
        token_balance = await erc20.getBalance(token,user_address,web3)
    } else {
        token_balance = await web3.eth.getBalance(user_address)
    }
    return token_balance
}

async function get_token_decimal(token:string,web3:Web3) {
    let decimal
    if (token != ERA_MAIN.eth_address) {
        decimal = await erc20.getDecimals(token,web3)
    } else {
        decimal= 18
    }
    return decimal
}

async function swapToken(from_token:string,to_token:string,amount_in) {

    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

    let from_balance = await get_token_balance(from_token,account.address,web3)
    let to_balance = await get_token_balance(to_token,account.address,web3)

    let from_decimal = await get_token_decimal(from_token,web3)
    let to_decimal = await get_token_decimal(from_token,web3)


    if(parseUnits(amount_in,from_decimal).gt(from_balance)) { 
        throw Error('from_balance not enough');
    }

    console.log(`before odos swap,from_balance:${formatUnits(from_balance,from_decimal)},to_balance:${formatUnits(to_balance,to_decimal)}`)

    var slippage = 1 //1% 
    //1,get Quote
    const quote = await getQuote(account.address,from_token, to_token, parseUnits(amount_in,from_decimal), slippage)
    if(!quote.pathId) return

    // 2. Extract transaction object from assemble API response
    const assembleTX = (await getAssembleTranction(account.address,quote.pathId)).transaction;

    if(from_token != ERA_MAIN.eth_address )
        await erc20.approve(from_token,account.address,router_address,PRIVATE_KEY,web3)

    const transactionCount = await web3.eth.getTransactionCount(account.address);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);


    let tx = {
        nounce: web3.utils.toHex(transactionCount),
        gasPrice: price,
        from: account.address,
        to: Web3.utils.toChecksumAddress(assembleTX['to']),
        value: web3.utils.toHex(assembleTX['value']),
        data: assembleTX['data']
    };

    await erc20.approve(from_token,account.address,assembleTX['to'],PRIVATE_KEY,web3)

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)
    // 3b. sign transaction with private key
    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

    from_balance = await get_token_balance(from_token,account.address,web3)
    to_balance = await get_token_balance(to_token,account.address,web3)
    console.log(`after odos swap,from_balance:${formatUnits(from_balance,from_decimal)},to_balance:${formatUnits(to_balance,to_decimal)}`)

    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);
  
} 







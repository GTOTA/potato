import { parseEther, parseUnits, formatUnits, formatEther, Interface } from "ethers/lib/utils";
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


var rpc_url: string

export default async function (hre) {

  rpc_url = hre.userConfig.networks?.zkSyncTestnet?.url

  console.log('rpc: ', rpc_url)

  let features = require('readline-sync');
  console.log(`-----MENU RUN SCRIPT ZKSYNC odos-----.`.green)
  console.log(`1. refuel/....`)
  console.log(`2. swapTokenToETH/....`)

  console.log(`0. Exit`)
  var amountIn = process.env.AMOUNT_IN || '0'

  let nameFeature = features.question("Choose your features: ".green);
  switch (nameFeature) {
    case '1': {
      await refuel('ZKSYNC', 'BSC', false)
      break
    }

    case '0':
      process.exit(0)
    default:
      break;
  }
}

const router_address = '0x4bBa932E9792A2b917D47830C93a9BC79320E4f7'



async function get_token_balance(token: string, user_address: string, web3: Web3) {
  let token_balance
  if (token != ERA_MAIN.eth_address) {
    token_balance = await erc20.getBalance(token, user_address, web3)
  } else {
    token_balance = await web3.eth.getBalance(user_address)
  }
  return token_balance
}

async function get_token_decimal(token: string, web3: Web3) {
  let decimal
  if (token != ERA_MAIN.eth_address) {
    decimal = await erc20.getDecimals(token, web3)
  } else {
    decimal = 18
  }
  return decimal
}


async function getRefuelData() {
  const socketUrl = 'https://refuel.socket.tech/chains';

  const response = await fetch(
    socketUrl,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

  if (response.status === 200) {
    const data = await response.json();
    return data['result']
    // handle Transaction Assembly response data

  } else {
    console.error('Error in Transaction Assembly:', response);
    // handle quote failure cases
  }
}

async function get_bungee_limits() {

  let bungee_data = await getRefuelData()
  //console.log(bungee_data)

  var zksync_limit

  bungee_data.map((chain_data, index) => { if (chain_data["name"] == "zkSync") zksync_limit = chain_data["limits"] })

  return zksync_limit

}

const BUNGEE_ABI = require("../../abis/bungee/abi.json")
const BUNGEE_ADDRESS = '0x7ee459d7fde8b4a3c22b9c8c7aa52abaddd9ffd5'

const chain_ids = {
  "BSC": 56,
  "OPTIMISM": 10,
  "GNOSIS": 100,
  "POLYGON": 137,
  "BASE": 8453,
  "ARBITRUM": 42161,
  "AVALANCHE": 43114,
  "AURORA": 1313161554,
  "ZK_EVM": 1101,
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


async function refuel(from_chain: string, to_chain: string, random: boolean) {

  const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

  let limits_data = await get_bungee_limits()

  let to_chain_limits = null

  console.log(limits_data )

  console.log(chain_ids[to_chain] )

  limits_data.map((limit_data) => { if (chain_ids[to_chain] == (limit_data['chainId'] as number) && limit_data['isEnabled'] as boolean) to_chain_limits = limit_data })

  if (to_chain_limits) {
    var min_amount = Math.floor(to_chain_limits["minAmount"])
    var max_amount = Math.floor(to_chain_limits["maxAmount"])

    var amount = random ? getRandomInt(min_amount, max_amount) : min_amount

    console.log(`refuel from ${from_chain} to ${to_chain} :${formatEther(amount)} ETH`);

    let bungee_contract = new web3.eth.Contract(BUNGEE_ABI, BUNGEE_ADDRESS);

    let price = await web3.eth.getGasPrice()
    console.log(`L2 gasPrice ${formatEther(price)} ETH`);
    
    var chain_id = to_chain_limits['chainId'] as number

    const tx_data = bungee_contract.methods.depositNativeToken(chain_id, Web3.utils.toChecksumAddress(account.address)).encodeABI()

    console.log(tx_data)

    let tx = {
      nounce: web3.utils.toHex(await web3.eth.getTransactionCount(account.address)),
      gasPrice: await web3.eth.getGasPrice(),
      from:  Web3.utils.toChecksumAddress(account.address),
      to: BUNGEE_ADDRESS,
      value: amount,
      data: tx_data
    };

    let gasLimit = await web3.eth.estimateGas(tx)
    tx['gas'] = gasLimit

    console.log(tx)
    
    // 3b. sign transaction with private key
    let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
    console.log(`${account.address}  TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

  }
}







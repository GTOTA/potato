import { ethers } from "ethers";
import Web3 from 'web3';

// load env file
import dotenv from "dotenv";
import { parseEther } from "ethers/lib/utils";
dotenv.config();


const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const SAFE_CONTRACT_ABI = require("../../abis/safe/abi.json")
const SAFE_CONTRACT_ADDRESS = '0xDAec33641865E4651fB43181C6DB6f7232Ee91c2'



var rpc_url: string

export default async function (hre) {

  rpc_url = hre.userConfig.networks?.zkSyncTestnet?.url

  console.log('rpc: ', rpc_url)

  let features = require('readline-sync');
  console.log(`-----MENU RUN SCRIPT ZKSYNC SAFE-----.`.green)
  console.log(`1. create safe 1/2/....`)
  console.log(`2. send eth to safewallet/....`)
  console.log(`3. send transaction/....`)

  console.log(`0. Exit`)
  var amountIn = process.env.AMOUNT_IN || '0'
  var safeAddress = process.env.SAFE_ADDRESS || '0'


  let nameFeature = features.question("Choose your features: ".green);
  switch (nameFeature) {
    case '1': {
      await createSafe(safeAddress)
      break
    }
    case '2': {
      await safeTransafer(safeAddress,amountIn)
    }
    case '0':
      process.exit(0)
    default:
      break;
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


async function createSafe(safe_address) {

  const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

  let price = await web3.eth.getGasPrice()
  console.log(`L2 gasPrice ${ethers.utils.formatEther(price)} ETH`);

  let safe_contract = new web3.eth.Contract(SAFE_CONTRACT_ABI, SAFE_CONTRACT_ADDRESS);

  const setup_data = safe_contract.methods.setup([account.address],
    1,
    ethers.constants.AddressZero,
    '0x',
    Web3.utils.toChecksumAddress(safe_address),
    ethers.constants.AddressZero,
    0,
    ethers.constants.AddressZero).encodeABI()


  const tx_data = safe_contract.methods.createProxyWithNonce(Web3.utils.toChecksumAddress('0x1727c2c531cf966f902E5927b98490fDFb3b2b70'), setup_data, 0).encodeABI()
  console.log(tx_data)

  let tx = {
    nounce: web3.utils.toHex(await web3.eth.getTransactionCount(account.address)),
    gasPrice: await web3.eth.getGasPrice(),
    from: Web3.utils.toChecksumAddress(account.address),
    to: SAFE_CONTRACT_ADDRESS,
    value: 0,
    data: tx_data
  };

  let gasLimit = await web3.eth.estimateGas(tx)
  tx['gas'] = gasLimit

  // 3b. sign transaction with private key
  let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
  let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
  console.log(`${account.address}  createSafe TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

}

async function safeTransafer(safe_address,amount_in) {

  const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url))

  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY)

  let features = require('readline-sync');
  console.log(`transfer to ${safe_address} amount :${amount_in} .do you wanna continue.\n`)
  let nameFeature = features.question("do you wanna continue. Y/N:/.... ".green);

  switch (nameFeature) {
    case 'Y': {
      break
    }
    case 'N':
      process.exit(0)
    default:
      break;
  }

  let tx = {
    nounce: web3.utils.toHex(await web3.eth.getTransactionCount(account.address)),
    gasPrice: await web3.eth.getGasPrice(),
    from: Web3.utils.toChecksumAddress(account.address),
    to: safe_address,
    value:  web3.utils.toHex(web3.utils.toWei(amount_in,'ether'))
  };

  let gasLimit = await web3.eth.estimateGas(tx)
  tx['gas'] = gasLimit

  // 3b. sign transaction with private key
  let signed_tx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
  let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
  console.log(`${account.address}  safeTransafer TX:   https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);




}







import * as zksync from "zksync-web3";
import * as ethers from "ethers";
import { formatEther } from "ethers/lib/utils";

import BigNumber from "bignumber.js";

const ABI = require("../../abis/velocore/Vault.json");
const ROUTER_ABI = require("../../abis/velocore/Router.json");


const SYNC_ABI = require("../../abis/syncswap/SyncSwapRouter.json");


//const provider = new zksync.Provider(" https://mainnet.era.zksync.io");


//work hash
//0x1dc98d2ef344bd58817b3772bd49c0a8e5c27812c5433f9d459d9eecf1195408

//LP
//0x471f4b4d081b02e15580d563da85f201cfdba0e60c9ae2177b39b371bd169011


//0xb7108666e59036425a586e6b157bb553ea6a8f34a06b975ec9e00e3ffa53d1a7

//0x546b40f07ce1de78dcf0e975d84e7cf181670b8247606af10549c4d804d84937

var rpc_url

export default async function (hre) {
  rpc_url = (hre.userConfig.networks?.zkSyncTestnet?.url);

  var nft_id = parseInt('0xca') 

  console.log(nft_id)

  await encode_method_no_parmas()
}

async function decode_method(url) {
  const provider = new zksync.Provider(rpc_url);

  const tx = await provider.getTransaction('0x0ad82e57bed664cbbba4a02b8a6b5f37da2c93ed396fe86d57a02badbca49dcb');


  const hexString = "0x1550f7dca70000'";

  console.log(new BigNumber(0x25b848).toString(10));
  console.log(ethers.utils.formatEther(new BigNumber(0x25b848).toString(10)));

  const l1GasPrice = await provider.getGasPrice();
  console.log(`L1 gasPrice ${ethers.utils.formatEther(l1GasPrice)} ETH`);

  const inter = new ethers.utils.Interface(SYNC_ABI);

  console.log(tx)

  const decodedInput = inter.parseTransaction({ data: tx.data, value: tx.value });
  console.log(tx.gasPrice);

  // tx.data = "0x94ec6d7800000000000000000000000080115c708e12edd42e504c1cd52aea96c547c05c00000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000001a0ea5e0af000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000000020000000000000000000000003355df6d4c9c3035724fd0e3914de96a5a83aaf400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001550f7dca700000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a13c10c0d5bd6f79041b9835c63f91de35a158830000000000000000000000000000000000000000000000000000000000000000"

  //tx.data = "0xd3115a8a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000020000000000000000000000003cd3e41ff4b95a8ddc915f3c7615ab6f2b478c33eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000001c6bf52634000010100000000000000000000000000000000000000000000000110d9316ec00000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000"
  const data = inter.decodeFunctionData("addLiquidity2", tx.data);
  //console.log(tx);

  // console.log(data);
  console.log(data);
  console.log(data.inputs);


  // Decoded Transaction
  console.log({
    function_name: decodedInput.name,
    from: tx.from,
    to: decodedInput.args[0],
    erc20Value: Number(decodedInput.args[1])
  });

}


async function encode_method() {

  let ABI = [
    "function redeem(uint256 amount)"
  ];
  let iface = new ethers.utils.Interface(ABI);
  var endata = iface.encodeFunctionData("redeem", [4959458729])

  console.log(endata)
  return endata
}

async function encode_method_no_parmas() {

  let ABI = [
    "function swapCompact()"
  ];
  let iface = new ethers.utils.Interface(ABI);
  var endata = iface.encodeFunctionData("swapCompact", [])

  console.log(endata)
  return endata
}


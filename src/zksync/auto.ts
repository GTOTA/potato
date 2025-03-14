
import colors from 'colors'
import Web3 from 'web3'
import * as ethers from "ethers";

import {syncswap_runner,velocore_runner,spacefi_runner,izumi_runner ,mute_runner,pancake_runner, era_name_runner,zks_name_runner} from '../../src/runner'
import { ERA_MAIN } from '../../src/utils/token';

// load env file
import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";

let wallets = PRIVATE_KEY.split(' ');

export default async function (hre) {
    colors.enable()

    console.log(`start.`)

    let features = require('readline-sync');
    console.log(`-----MENU RUN SCRIPT ZKSYNC ERA-----.`.green)
    console.log(`1. Syncswap swap ETH TO USDCE/....`)
    console.log(`11. Syncswap swap USDC TO ETH/....`)
    console.log(`12. Syncswap add lp/....`)
    console.log(`13. Syncswap remove lp/....`)

    console.log(`2. Velocore swap /....`)
    console.log(`21. Velocore swap USDC TO ETH/....`)
    console.log(`22. Velocore add lp /....`)
    console.log(`23. Velocore remove lp /....`)
    console.log(`24. Velocore vote lp /....`)
    console.log(`3. Spacefi swap /....`)
    console.log(`31. Spacefi add lp /....`)
    console.log(`32. Spacefi remove lp /....`)
    console.log(`4. Izumi swap /....`)
    console.log(`41. Izumi add lp /....`)
    console.log(`42. Izumi remove lp /....`)
    console.log(`5. Mute swap /....`)
    console.log(`6. Pancake swap /....`)
    console.log(`61. Pancake swap usdc /....`)
    console.log(`7. Regist Era Name Service /....`)
    console.log(`71. Set Era Primaddress Service /....`)
    console.log(`8. Regist ZKS Service /....`)
    console.log(`81. Set ZKS Primaddress Service /....`)


    console.log(`0. Exit`)

    const chain_rpc = hre.userConfig.networks?.zkSyncTestnet?.url

    //const chain_rpc = 'http://127.0.0.1:8011'
    console.debug("chain_rpc:"+chain_rpc)
    const web3 = new Web3(new Web3.providers.HttpProvider(chain_rpc))

    let nameFeature = features.question("Choose your features: ".green);
    try {
        for (let i = 0; i < wallets.length; i++) {
            const account =  web3.eth.accounts.privateKeyToAccount(wallets[i])

            console.log(`Handing address: ${account.address} eth balance: ${ethers.utils.formatEther(await web3.eth.getBalance(account.address))}`)
            let swap_value = process.env.AMOUNT_IN || ''
            console.log('syncswap swap eth_value:'+swap_value)

            //let nameFeature  = getRandomInt(1,18)+''
            console.log("Choose your features:"+nameFeature) 
            try {
                switch (nameFeature) {
                    case '1':
                        await syncswap_runner.swap(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',swap_value,wallets[i],chain_rpc)
                        break;
                    case '11':
                        await syncswap_runner.swap(ERA_MAIN.usdc_address,ERA_MAIN.weth_address,'USDC',swap_value,wallets[i],chain_rpc)
                        break;
                    case '12': {
                        await syncswap_runner.addliquidity(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',swap_value,'',wallets[i],chain_rpc)
                        break;
                    }
                    case '13':
                        let percent = getRandomInt(100, 100)+''
                        await syncswap_runner.burnliquidity(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,percent,wallets[i],chain_rpc)
                        break;
                    case '14': {
                        await syncswap_runner.swap(ERA_MAIN.weth_address,ERA_MAIN.eth_address,'WETH',swap_value,wallets[i],chain_rpc)
                        break;
                    }
                    case '2':{
                   
                        await velocore_runner.swap(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',swap_value,wallets[i],chain_rpc)
                        break;
                    }
                    case '21':{
                       
                        await velocore_runner.swap(ERA_MAIN.usdc_address,ERA_MAIN.eth_address,'USDC',swap_value,wallets[i],chain_rpc)
                        break;
                    }
                    case '22':{
                        let lp_value = process.env.AMOUNT_LP || '0'
                        await velocore_runner.addliquidity(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',swap_value,lp_value,wallets[i],chain_rpc)
                        break;
                    }
                    case '23':{
                        let percent = getRandomInt(100, 100)+''
                        await velocore_runner.burnliquidity(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',percent,wallets[i],chain_rpc)
                        break;
                    } 
                    case '24':{
                        let percent = getRandomInt(100, 100)+''
                        await velocore_runner.vote(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',ERA_MAIN.vc_adress,ERA_MAIN.vevc_adress,percent,wallets[i],chain_rpc)
                        break;
                    }
                    case '3':{
                        await spacefi_runner.swap(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',swap_value,wallets[i],chain_rpc)
                        break;
                    }
                    case '31':{
                        let lp_value = process.env.AMOUNT_LP || ''
                        await spacefi_runner.addliquidity(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',swap_value,lp_value,wallets[i],chain_rpc)
                        break;
                    }
                    case '32':{
                        let percent = getRandomInt(100, 100)+''
                        await spacefi_runner.burnliquidity(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',percent,wallets[i],chain_rpc)
                        break;
                    } 
                    case '4':{
                        await izumi_runner.swap(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',swap_value,wallets[i],chain_rpc)
                        break;
                    }
                    case '41':{
                        //await izumi_runner.addliquidity(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',eth_value,usdc_value,wallets[i],chain_rpc)
                        break;
                    }
                    case '42':{
                        let percent = getRandomInt(55, 100)+''
                        //await izumi_runner.burnliquidity(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',percent,wallets[i],chain_rpc)
                        break;
                    } 
                    case '5':{
                        await mute_runner.swap(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',swap_value,wallets[i],chain_rpc)
                        break;
                    }
                    case '6':{
                        await pancake_runner.swap(ERA_MAIN.weth_address,ERA_MAIN.usdc_address,'ETH',swap_value,wallets[i],chain_rpc)
                        break;
                    }  
                    case '61':{
                        await pancake_runner.swap(ERA_MAIN.usdc_address,ERA_MAIN.weth_address,'USDC',swap_value,wallets[i],chain_rpc)
                        break;
                    } 
                    case '7':{
                        let era_name = getRandomString(6,'a')
                        await era_name_runner.regist(era_name,wallets[i],chain_rpc)
                        break;
                    } 
                    case '71':{
                        let era_name = process.env.ZKS_NAME || "";
                        await era_name_runner.setPrimaryAddress(era_name,wallets[i],chain_rpc)
                        break;
                    }
                    case '8':{
                        let zks_name = getRandomString(6,'a')
                        console.log('regist zks_name:'+zks_name)
                        await zks_name_runner.regist(zks_name,wallets[i],chain_rpc)                        
                        break;
                    } 
                    case '81':{
                        let zks_name = process.env.ZKS_NAME || "";
                        console.log('setPrimaryAddress zks_name:'+zks_name)
                        await zks_name_runner.setPrimaryAddress(zks_name,wallets[i],chain_rpc)                 
                        break;
                    } 
                    case '0':
                        process.exit(0)
                    default:
                        break;
                }
            } catch (e) {
                console.log(`error on handing ${account.address}`)
                console.log(e)
                //process.exit(1)

            }
            await sleep(getRandomInt(5000, 10000))

        }
        await sleep(getRandomInt(5000, 8000))
        console.log(`Resting....`)

    } catch (e) {
        console.log(`${e}`)
        process.exit(1)
    }
}

function getRandomString(len, an) {
    an = an && an.toLowerCase();
    var str = "",
      i = 0,
      min = an == "a" ? 10 : 0,
      max = an == "n" ? 10 : 62;
    for (; i++ < len;) {
      var r = Math.random() * (max - min) + min << 0;
      str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
    }
    return str;
  }

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomFloat(min, max) {
    return (Math.random() * (max - min) + min).toFixed(3);
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

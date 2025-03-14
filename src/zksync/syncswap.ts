import * as zksync from "zksync-web3";
import * as ethers from "ethers";

// Currently, only one environment is supported.
import { Wallet, Provider } from "zksync-web3";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import colors from "colors";
colors.enable()

import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ZksyncEraTestnet } from "@thirdweb-dev/chains";

// load env file
import dotenv from "dotenv";
import { formatEther } from "@ethersproject/units";
dotenv.config();

//const zksync = require("zksync-web3");
//const ethers = require('ethers');


const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";


const WALLET_ADDRESS = "0xCff4De693fDCDDD00517B3cbE6769CC0C052F770";
if (!WALLET_ADDRESS) 
    throw "⛔️ WALLET_ADDRESS address not provided";



// For SELL contract
const ERC20ABI = require("../../abis/erc-20.json")
const classicPoolFactoryAbi = require("../../abis/syncswap/SyncSwapClassicPoolFactory.json")
const poolAbi = require("../../abis/syncswap/SyncSwapClassicPool.json")
const routerAbi = require("../../abis/syncswap/SyncSwapRouter.json");
const { exit } = require('process');

const ZERO_ADDRESS = ethers.constants.AddressZero;

// let wallets = []
// Object.keys(airdrops).forEach(k => {
//     wallets.push(new ethers.Wallet(airdrops[k], provider))
    
// })
/* for testnet*/
// const wETHAddress = "0x20b28B1e4665FFf290650586ad76E977EAb90c5D";
// const usdcAddress = "0x0faF6df7054946141266420b43783387A78d82A9";
// const daiAddress= "0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b";
// const routerAddress = "0xB3b7fCbb8Db37bC6f572634299A58f51622A847e";
// const classicPoolFactoryAddress = "0xf2FD2bc2fBC12842aAb6FbB8b1159a6a83E72006";

/* for mainnet*/

const wETHAddress = "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91";
const usdcAddress = "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4";
const daiAddress= "0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b";
const classicPoolFactoryAddress = "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb"
const routerAddress = "0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295"



var zkSyncProvider;
var zkSyncWallet;

export default async function (hre: HardhatRuntimeEnvironment)  {
    console.log(`start.`)

    let features = require('readline-sync');
    console.log(`-----SYNCSWAP MENU FOR ZKSYNC ERA-----.`.red)
    console.log(`1. Swap ETH to USDC `)
    console.log(`2. Swap ETH to DAI`)
    console.log(`3. Approval USDC for SELL ERC-ETH`)
    console.log(`4. Approval DAI for SELL ERC-ETH`)
    console.log(`5. Swap USDC to ETH`)
    console.log(`6. Swap DAI to ETH`)
    console.log(`7. Swap ETH to Custom contract`)
    console.log(`8. Claim NFT on `)
    console.log(`9. depostZksync `)
    console.log(`10. transferZksync `)
    console.log(`11. withdrowZksync `)
    console.log(`0. Exit`)

    let nameFeature = features.question("Choose your features: ".red);
    let txn = features.question("Number of batch run: ")
    let batch = 1
    let excludeCA = false;
    let customCA

    let wallets = [];
    const ethProvider = ethers.getDefaultProvider("goerli");
    
    zkSyncProvider = new Provider(hre.userConfig.networks?.zkSyncTestnet?.url);
    //zkSyncProvider = new Provider("https://testnet.era.zksync.dev");
    zkSyncWallet = new zksync.Wallet(PRIVATE_KEY, zkSyncProvider, ethProvider);
    wallets.push(zkSyncWallet);
    let tx ;
    while (batch <= txn) {
       
        try {
            console.log(`---BATCH Number: ${batch}.`)
            for (let i = 0; i < wallets.length; i++) {
                let wallet_address = await wallets[i].getAddress()
                console.log(`Handing address: ${wallet_address}`);
                //var balance = await zkSyncProvider.getBalance(wallet_address);
                //console.log(' balance before swap:'+ ethers.utils.formatEther(balance));
                try {
                    switch (nameFeature) {
                        case '1': {
                            console.log(`Waiting swap eth to usdc transaction: ${wallet_address}`);
                            const eth_value = ethers.utils.parseEther((getRandomFloat(8, 11) / 10 ** 4).toFixed(9) + '')
                            console.log("Value ETH Random (Value from 0.01 to 0.02$): "+eth_value/(10**18))
                            tx = await swapETHForErc20(wallets[i], wETHAddress, usdcAddress, eth_value);
                            await sleep(getRandomInt(5000, 10000))
                            break;
                        }
                        case '2': {
                            console.log(`Waiting swap eth to dai transaction: ${wallet_address}`);
                            const eth_value = ethers.utils.parseEther((getRandomFloat(8, 11) / 10 ** 4).toFixed(9) + '')
                            console.log("Value ETH Random (Value from 0.01 to 0.02$): "+eth_value/(10**18))
                            tx = await swapETHForErc20(wallets[i], wETHAddress, daiAddress, eth_value);
                            await sleep(getRandomInt(5000, 10000))
                            break;
                        }
                        case '3':
                            tx = await approvalToken(wallets[i],usdcAddress)
                            break;
                        case '4':
                            tx = await approvalToken(wallets[i],daiAddress)
                            break;    
                        case '5': {
                            console.log(`Waiting swap usdc to eth transaction: ${wallet_address}`);
                            let tokenaddress = usdcAddress;
                            let ebalance = await balanceOfErc20(wallet_address,tokenaddress);
                            const usdcvalue = ethers.utils.parseUnits(getRandomFloat(8, 11)+'',6);
                            console.log(' swap balance of usdc:'+ ethers.utils.formatUnits(usdcvalue,6));
                            console.log(' balance of usdc:'+ ethers.utils.formatUnits(ebalance, 18));

                            if(usdcvalue.gt(ebalance)> 0) {
                                console.log('Insufficient balance  of usdc!!!');
                                break;
                            }
                            
                            tx = await swapErc20ForETH(wallets[i], tokenaddress,wETHAddress, usdcvalue)
                            break;
                        }
                        case '6': {
                            console.log(`Waiting swap dai to eth transaction: ${wallet_address}`);
                            let tokenaddress = daiAddress;
                            let ebalance = await balanceOfErc20(wallet_address,tokenaddress);
                            const daivalue = ethers.utils.parseUnits(getRandomFloat(8, 11)+'',6);
                            console.log(' swap balance of dai:'+ ethers.utils.formatUnits(daivalue, 6));
                            console.log(' balance of dai:'+ ethers.utils.formatUnits(ebalance, 18));

                            if(daivalue.gt(ebalance)> 0) {
                                console.log('Insufficient balance  of dai!!!');
                                break;
                            }

                            tx = await swapErc20ForETH(wallets[i], tokenaddress,wETHAddress, 10)
                            break;
                        }
                        
                        case '7':
                            // RANDOM ETH Value covert
                            if(excludeCA == false){
                                customCA = features.question("Fill custom contract (N: Non-Contract): ");
                                if(customCA == "N".toLowerCase()) excludeCA = true;
                            }  

                            //const value = ethers.utils.parseEther((getRandomFloat(8, 11) / 10 ** 6).toFixed(9) + '')

                            const value = parseEther('0.002')
                            //console.log("Value ETH Random (Value from 0.01 to 0.02$): "+value/(10**18))

                            /*
                            * CA ETH: 0x5aea5775959fbc2557cc8789bc1bf90a239d9a91
                            * CA USDC: 0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4
                            */
                            if(!(excludeCA) || excludeCA == false )
                                tx = await swapETHForErc20(wallets[i], wETHAddress, customCA, value)
                            else
                                tx = await swapETHForErc20(wallets[i], wETHAddress, usdcAddress, value)
                            break;
                        
                        case '8':
                            tx = await claimThirdNFT(wallets[i])
                            break;   
                        case '9':{
                            tx = await depositZksync('0.005',wallets[i]);
                            break;
                        } 
                        case '10':{
                            tx = await transferZksync('0xb6CdCfDcA1eeD64D9e64cb367b1B761A4dC08F03','0.001',wallets[i]);
                            break;
                        } 
                        case '11':{
                            tx = await withdrowZksync('0.002',wallets[i]);
                            break;
                        } 
                        case '12':{
                            const value = ethers.utils.parseEther('0.005')
                            console.log("addLiquidity Value ETH Random (Value from 0.01 to 0.02$): "+ formatEther(value))
                            tx = await addLiquidity(wallets[i], wETHAddress, "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4", value)
                        }
                        
                        default:
                            break;
                    }
                    if(tx) console.log(`Transaction to swap is `+ tx.transactionHash);
                    console.log(`---End batch ${batch}---.`)
                   
                } catch (e) {
                    console.log(`error on handing ${wallet_address}`)
                    console.log(e)
                }
            }
            console.log(`---BATCH NUMBER: ${batch}.`)

            batch ++;
            await sleep(getRandomInt(5000, 8000))
            console.log(`Resting....`)

        } catch(e) {
            console.log(`${e}`)
        }
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function balanceOfErc20(wallet,tokenaddress){
    const erc20Token = new ethers.Contract(tokenaddress, ERC20ABI, zkSyncProvider);
    return await erc20Token.balanceOf(wallet);
}


async function depositZksync(amountIn,zkSyncWallet) {
    console.log('depostZksync amount:'+amountIn);
    
    const deposit = await zkSyncWallet.deposit({
        token: zksync.utils.ETH_ADDRESS,
        amount: ethers.utils.parseEther(amountIn)
      });


    // Await processing of the deposit on L1
    const ethereumTxReceipt = await deposit.waitL1Commit();

    console.log(`---End ethereumTxReceipt ${ethereumTxReceipt}---.`)

    // Await processing the deposit on zkSync
    const depositReceipt = await deposit.wait();
    // Retrieving the current (committed) zkSync ETH balance of an account
    const committedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS);
    console.log('committedEthBalance:'+ethers.utils.formatEther(committedEthBalance));

    // Retrieving the ETH balance of an account in the last finalized zkSync block.
    const finalizedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS, "finalized");
    console.log('finalizedEthBalance:'+ethers.utils.formatEther(finalizedEthBalance));
    return depositReceipt;

}

async function transferZksync(address2,amountIn,zkSyncWallet){
    const amount = ethers.utils.parseEther(amountIn);

    console.log('transferZksync amount:'+amountIn);
    const transfer = await zkSyncWallet.transfer({
        to: address2,
        token: zksync.utils.ETH_ADDRESS,
        amount,
    });

    // Await commitment
    const committedTxReceipt = await transfer.wait();
    // Await finalization on L1
    const finalizedTxReceipt = await transfer.waitFinalize();

    return committedTxReceipt;
}

async function withdrowZksync(amountIn,zkSyncWallet){
    const amount = ethers.utils.parseEther(amountIn);
    console.log('withdrow amount:'+amountIn);
    const withdrawL2 = await zkSyncWallet.withdraw({
        token: zksync.utils.ETH_ADDRESS,
        amount: amount,
      });

    // Await commitment
    const committedTxReceipt = await withdrawL2.wait();

    return committedTxReceipt;
}

async function approvalToken(wallet,tokenaddress){
    //const provider = new Provider("https://testnet.era.zksync.dev");
    const erc20Contract = new ethers.Contract(tokenaddress, ERC20ABI, wallet);
    var wallet_address =  await wallet.getAddress();
    var balance = await erc20Contract.balanceOf(wallet_address);
    console.log(' balance of usdc:'+ ethers.utils.formatUnits(balance, 18));

    let allowance = await erc20Contract.allowance(wallet_address, routerAddress)
    console.log(`Waiting transaction approval: ${wallet_address} allowance: ${allowance}`);

    if (allowance.lte(balance)) {
        console.log("-----------approve-------------")
        let res = await erc20Contract.approve(routerAddress, balance)
        return res.wait()
    }
}

async function taskSyncswap(wallet) {

    // RANDOM ETH Value covert
    const value = ethers.utils.parseEther((getRandomFloat(8, 11) / 10 ** 6).toFixed(9) + '')

    console.log("Value ETH: "+value/(10**18))

    /*
    * INPUT CONTRACT ETH & CONTRACT ERC2
    * CA ETH: 0x5aea5775959fbc2557cc8789bc1bf90a239d9a91
    * CA USDC: 0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4
    */
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x0e97C7a0F8B2C9885C8ac9fC6136e829CbC21d42", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0xdd9f72afED3631a6C85b5369D84875e6c42f1827", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0xd599dA85F8Fc4877e61f547dFAcffe1238A7149E", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0xD0eA21ba66B67bE636De1EC4bd9696EB8C61e9AA", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x47260090cE5e83454d5f05A0AbbB2C953835f777", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x85D84c774CF8e9fF85342684b0E795Df72A24908", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x787c09494ec8bcb24dcaf8659e7d5d69979ee508", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x493257fd37edb34451f62edf8d2a0c418852ba4c", value)
    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x5756A28E2aAe01F600FC2C01358395F5C1f8ad3A", value)   
}

async function addLiquidity(wallet, wETHAddress, erc20Address, amountIn) {
    try{
           // The factory of the Classic Pool.
        const classicPoolFactory = new ethers.Contract(
            classicPoolFactoryAddress,
            classicPoolFactoryAbi,
            wallet
        );

        // Gets the address of the ETH/DAI Classic Pool.
        // wETH is used internally by the pools.
        let poolAddress = await classicPoolFactory.getPool(wETHAddress, erc20Address);

        // Checks whether the pool exists.
        if (poolAddress === ZERO_ADDRESS) {
            throw Error('Pool not exists');
        }


        console.log(poolAddress)
          // Gets the reserves of the pool.
        const pool = new ethers.Contract(poolAddress, poolAbi, zkSyncProvider);
        const reserves = await pool.getReserves(); // Returns tuple (uint, uint)

        console.log(reserves)

        let usdc_token = "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4"
        let usdt_token = "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C"
        let from_token = wETHAddress
        let to_token = erc20Address

        // The input amount of ETH
        const value = amountIn
        const addressWallet = await wallet.getAddress()
        const swapData = ethers.utils.defaultAbiCoder.encode(
            ["address"],
            [ addressWallet], 
        );

        let callback = ZERO_ADDRESS
        let  min_liquidity = 111914901679

        const router = new ethers.Contract(routerAddress, routerAbi, wallet);

        await approvalToken(wallet,usdt_token);

        let tx = await router.addLiquidity2(
            poolAddress,
            [
                {
                    token: to_token, 
                    amount:  0
                },
                {
                    token: callback, 
                    amount: amountIn
                }
            ],
            swapData,
            min_liquidity,
            callback,
            '0x',
            {
                value: amountIn,  // please uncomment this if your token in is ETH
                gasLimit: 2572008,
                gasPrice: ethers.utils.parseUnits('0.25', 'gwei')

            }
        )
        console.log(`Waiting transaction from: ${addressWallet}`.green);

        return tx.wait();
        
    }
    catch(error) {
        console.error(error);
    }
}

async function swapETHForErc20(wallet, wETHAddress, erc20Address, amountIn) {
    try{
           // The factory of the Classic Pool.
        const classicPoolFactory = new ethers.Contract(
            classicPoolFactoryAddress,
            classicPoolFactoryAbi,
            wallet
        );

        // Gets the address of the ETH/DAI Classic Pool.
        // wETH is used internally by the pools.
        const poolAddress = await classicPoolFactory.getPool(wETHAddress, erc20Address);

        // Checks whether the pool exists.
        if (poolAddress === ZERO_ADDRESS) {
            throw Error('Pool not exists');
        }

        // Gets the reserves of the pool.
        const pool = new ethers.Contract(poolAddress, poolAbi, zkSyncProvider);
        const reserves = await pool.getReserves(); // Returns tuple (uint, uint)

        // Sorts the reserves by token addresses.
        const [reserveETH, reserveErc20] = wETHAddress < erc20Address ? reserves : [reserves[1], reserves[0]];

        // The input amount of ETH
        const value = amountIn
        const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet
        const addressWallet = await wallet.getAddress()
        const swapData = ethers.utils.defaultAbiCoder.encode(
            ["address", "address", "uint8"],
            [wETHAddress, await wallet.getAddress(), withdrawMode], // tokenIn, to, withdraw mode
        );

        // We have only 1 step.
        const steps = [{
            pool: poolAddress,
            data: swapData,
            callback: ZERO_ADDRESS, // we don't have a callback
            callbackData: '0x',
        }];

        // Note: however we still have to encode the wETH address to pool's swap data.
        const nativeETHAddress = ZERO_ADDRESS;

        // We have only 1 path.
        const paths = [{
            steps: steps,
            tokenIn: nativeETHAddress,
            amountIn: value,
        }];

        // Gets the router contract.
        const router = new ethers.Contract(routerAddress, routerAbi, wallet);
        // console.log(`${minAmountOut}`)
        // Note: checks approval for ERC20 tokens.
        // The router will handle the deposit to the pool's vault account.
        const response = await router.swap(
            paths, // paths
            0, // amountOutMin // Note: ensures slippage here
            ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), // deadline // 30 minutes
            {
                //value: value,  // please uncomment this if your token in is ETH
                gasLimit: 800000,
                gasPrice: ethers.utils.parseUnits('0.261', 'gwei')

            }
        );
        
        console.log(`Waiting transaction from: ${addressWallet}`.green);

        return await response.wait();
        
    }
    catch(error) {
        console.error(error);
    }
}


async function swapErc20ForETH(wallet, erc20Address, wETHAddress, amountIn) {
    try{
        // The factory of the Classic Pool.
        const classicPoolFactory = new ethers.Contract(
            classicPoolFactoryAddress,
            classicPoolFactoryAbi,
            wallet
        );

        // Gets the address of the ETH/DAI Classic Pool.
        // wETH is used internally by the pools.
        const poolAddress = await classicPoolFactory.getPool(wETHAddress, erc20Address);

        // Checks whether the pool exists.
        if (poolAddress === ZERO_ADDRESS) {
            throw Error('Pool not exists');
        }

        // Gets the reserves of the pool.
        const pool = new ethers.Contract(poolAddress, poolAbi, zkSyncProvider);
        const reserves = await pool.getReserves(); // Returns tuple (uint, uint)

        // Sorts the reserves by token addresses.
        // const [reserveETH, reserveErc20] = wETHAddress < erc20Address ? reserves : [reserves[1], reserves[0]];

        // The input amount of ETH
        const value = amountIn
        // const minAmountOut = getAmountOut(value, reserveErc20, reserveETH)

        // Constructs the swap paths with steps.
        // Determine withdraw mode, to withdraw native ETH or wETH on last step.
        // 0 - vault internal transfer
        // 1 - withdraw and unwrap to naitve ETH
        // 2 - withdraw and wrap to wETH
        const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet

        const swapData = ethers.utils.defaultAbiCoder.encode(
            ["address", "address", "uint8"],
            [erc20Address, await wallet.getAddress(), withdrawMode], // tokenIn, to, withdraw mode
        );

        // We have only 1 step.
        const steps = [{
            pool: poolAddress,
            data: swapData,
            callback: ZERO_ADDRESS, // we don't have a callback
            callbackData: '0x',
        }];

        // We have only 1 path.
        const paths = [{
            steps: steps,
            tokenIn: erc20Address,
            amountIn: value,
        }];

        // Gets the router contract.
        const router = new ethers.Contract(routerAddress, routerAbi, wallet);
        // console.log(`${minAmountOut}`)
        // Note: checks approval for ERC20 tokens.
        // The router will handle the deposit to the pool's vault account.
        // GAS: 800000 Staturday
        const response = await router.swap(
            paths, // paths
            0, // amountOutMin // Note: ensures slippage here
            ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), // deadline // 30 minutes
            {
                value: amountIn,
                gasLimit: 800000,
                gasPrice: ethers.utils.parseUnits('0.25', 'gwei')              
            }
        );

        return await response.wait();
    }
    catch(error) {
        console.error(error);
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomFloat(min, max) {
    return (Math.random() * (max - min) + min).toFixed(3);
};


async function claimThirdNFT(wallet) {
    //If used on the FRONTEND pass your 'clientId'
    // const sdk = new ThirdwebSDK( "https://zksync-era-testnet.rpc.thirdweb.com", {
    //    clientId: 'f1eb86e330d6b792339bf6dab689884d',
    // });

   
     //Claim NFT
     const sdk = ThirdwebSDK.fromPrivateKey(
        PRIVATE_KEY, 
        "https://testnet.era.zksync.dev",
        {
            clientId: "be21d8a76f149ad3eec8aae055f9bc39",
            secretKey: "Yf7hxMqO4G4_twKzz6X_Jjuorzoq_uMj9vWDxv9uIO4ZpHCtFagm8DOnpy-_FiYWwyNjRinYqjqt2r3bWicG8A", 
        }
      );

    // const sdk = new ThirdwebSDK(ZksyncEraTestnet, {
    //     secretKey: "Yf7hxMqO4G4_twKzz6X_Jjuorzoq_uMj9vWDxv9uIO4ZpHCtFagm8DOnpy-_FiYWwyNjRinYqjqt2r3bWicG8A",
    //   });
          
    //const contract = await sdk.getContract("0xbBB3C56f0Ee015990e86A44a5FB5a8d33462200c");

    const contract = await sdk.getContract("0x1858B2888b8abeDBc6b558FaB5f85611e84f5d42");

    const address = "0xCff4De693fDCDDD00517B3cbE6769CC0C052F770"; // address of the wallet you want to claim the NFTs
    const quantity = 1; // how many unique NFTs you want to claim
    
    const tx = await contract.erc721.claimTo(address, quantity);
    const receipt = tx.receipt; // the transaction receipt
    const claimedTokenId = tx.id; // the id of the NFT claimed
    const claimedNFT = await tx.data(); // (optional) get the claimed NFT metadata
    console.log(
      "Address Claimed: ",
      address,
      "tx",
       receipt.transactionHash
    );
    return tx;
}


import Web3 from 'web3'
import * as ethers from "ethers";
import { BigNumber } from "ethers";
import {parseEther,parseUnits ,formatUnits, formatEther} from "ethers/lib/utils";
import * as erc20 from '../utils/erc20'
import {sleep} from '../utils/time'



import colors from 'colors'
colors.enable()


export class Syncswap {
    private_key: string;
    from_token: string;
    to_token: string;
    amount_from: string;
    amount_to: string;
    router_address:string;
   // router_abi: string;
    factory_address:string;
    //factory_abi:string;
    chain_rpc:string;
    address_wallet:string;

    factory_abi = require("../../abis/syncswap/SyncSwapClassicPoolFactory.json")
    pool_abi = require("../../abis/syncswap/SyncSwapClassicPool.json")
    router_abi = require("../../abis/syncswap/SyncSwapRouter.json");

    constructor(private_key: string, from_token: string, to_token: string, 
        router_address:string,factory_address:string,chain_rpc:string) {
            this.private_key = private_key
            this.from_token = from_token
            this.to_token = to_token
            this.router_address = router_address
            this.factory_address = factory_address
            this.chain_rpc = chain_rpc   
    }

    async swap(from_token: string, to_token: string, token:string, amountIn:string) {
        try{
            if( amountIn == null || amountIn.length == 0 ) {
                throw Error('swap value is null');
            }
            const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
            this.address_wallet =  web3.eth.accounts.privateKeyToAccount(this.private_key).address

            let eth_balance = await web3.eth.getBalance(this.address_wallet)

            if(token.toUpperCase() === "ETH" && parseEther(amountIn).gt(eth_balance)) {
                throw Error('eth_balance not enough');
            }
            if(token.toUpperCase() != "ETH") {
                let token_balance = await erc20.getBalance(from_token,this.address_wallet,web3)
                if(parseUnits(amountIn,6).gt(token_balance)) {
                    throw Error('usdc not enough');
                }
            }
               // The factory of the Classic Pool.
            const classicPoolFactory = new web3.eth.Contract(
                this.factory_abi,
                this.factory_address
            );
    
            // Gets the address of the ETH/DAI Classic Pool.
            // wETH is used internally by the pools.
            const poolAddress = await classicPoolFactory.methods.getPool(from_token,to_token).call();
    
            // Checks whether the pool exists.
            if (poolAddress === ethers.constants.AddressZero) {
                throw Error('Pool not exists');
            }
    
            // Gets the reserves of the pool.
            //const pool = new web3.eth.Contract(this.pool_abi,poolAddress);
            //const reserves = await pool.methods.getReserves().call(); // Returns tuple (uint, uint)
    
            // Sorts the reserves by token addresses.
            //const [reserveETH, reserveErc20] = from_token < to_token ? reserves : [reserves[1], reserves[0]];
    
            const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet
            const swapData = ethers.utils.defaultAbiCoder.encode(
                ["address", "address", "uint8"],
                [from_token, this.address_wallet, withdrawMode], // tokenIn, to, withdraw mode
            );
    
            // We have only 1 step.
            const steps = [{
                pool: poolAddress,
                data: swapData,
                callback: ethers.constants.AddressZero, // we don't have a callback
                callbackData: '0x',
            }];
    
            let token_in:string
            var value = parseEther(amountIn)
            if(token.toUpperCase() === "ETH") {
                token_in = ethers.constants.AddressZero
             }else {
                token_in = from_token
                value = parseUnits(amountIn,6)
             }
            // Note: however we still have to encode the wETH address to pool's swap data.
    
           
            // We have only 1 path.
            const paths = [{
                steps: steps,
                tokenIn: token_in,
                amountIn: value,
            }];
    
            // Gets the router contract.
            const router = new web3.eth.Contract(this.router_abi, this.router_address);
            // console.log(`${minAmountOut}`)
            // Note: checks approval for ERC20 tokens.
            // The router will handle the deposit to the pool's vault account.
            const encode_data = await router.methods.swap(
                paths, // paths
                0, // amountOutMin // Note: ensures slippage here
                ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)
            ).encodeABI()

            const gas_price = await web3.eth.getGasPrice();

            let swap_tx = {
                nounce: await web3.eth.getTransactionCount( this.address_wallet),
                gasPrice: gas_price,
                from: this.address_wallet,
                to: this.router_address,
                value: token.toUpperCase() === "ETH"? web3.utils.toHex(web3.utils.toWei(amountIn, 'ether')) : 0,
                data:encode_data
            }

            if(token.toUpperCase() != "ETH") {
                await erc20.approve(from_token,this.address_wallet,this.router_address,this.private_key,web3)
            }

            swap_tx['gas'] = await web3.eth.estimateGas(swap_tx)

            let before_balance = await erc20.getBalance(to_token,this.address_wallet,web3)
            console.log(`before swap,token_balance:${formatUnits(before_balance,6)}`)

            let signed_tx = await web3.eth.accounts.signTransaction(swap_tx, this.private_key)
            let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')  
            let after_balance = await erc20.getBalance(to_token,this.address_wallet,web3)
            let add_token  = BigNumber.from(after_balance).sub(before_balance)
            console.log(`Waiting transaction from: ${this.address_wallet} added ${formatUnits(add_token,6)} tokens on Syncswap | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`.green)     
        }
        catch(error) {
            console.log(error);
        }
    }


    public async addLiquidity(a_token: string, b_token: string, token:string,amount_a:string,amount_b:string){
        try {
            const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
            this.address_wallet =  web3.eth.accounts.privateKeyToAccount(this.private_key).address

            let eth_balance = await web3.eth.getBalance(this.address_wallet)
            if(token.toUpperCase() === "ETH" && parseEther(amount_a).gt(eth_balance)) {
                throw Error('eth_balance not enough');
            }

            if(token.toUpperCase() != "ETH") {
                let token_balance = await erc20.getBalance(a_token,this.address_wallet,web3)
                if(parseUnits(amount_a,6).gt(token_balance)) {
                    throw Error('token_balance not enough');
                }
            }

            // The factory of the Classic Pool.
            const classicPoolFactory = new web3.eth.Contract(
                this.factory_abi,
                this.factory_address
            );
    
            // Gets the address of the ETH/DAI Classic Pool.
            // wETH is used internally by the pools.
            const pool_address = await classicPoolFactory.methods.getPool(a_token,b_token).call();
    
            // Checks whether the pool exists.
            if (pool_address === ethers.constants.AddressZero) {
                throw Error('Pool not exists');
            }
    
            // Gets the reserves of the pool.
            const pool_contract = new web3.eth.Contract(this.pool_abi,pool_address);
            let lp_Balance = await pool_contract.methods.balanceOf(this.address_wallet).call();
            console.log("lp_balance before:"+formatEther(lp_Balance));
           
            const swapData = ethers.utils.defaultAbiCoder.encode(
                ["address"],
                [  this.address_wallet], 
            );
        
            let callback = ethers.constants.AddressZero
            let  min_liquidity = 0
        
            let amountIn = parseEther(amount_a)

             // Gets the router contract.
             const router_contract = new web3.eth.Contract(this.router_abi, this.router_address);
        
            const liquid_tx_data =  router_contract.methods.addLiquidity2(
                pool_address,
                [
                    {
                        token: b_token, 
                        amount: 0
                    },
                    {
                        token: callback, 
                        amount: amountIn
                    }
                ],
                swapData,
                min_liquidity,
                callback,
                '0x').encodeABI()
        
            const transactionCount = await web3.eth.getTransactionCount( this.address_wallet);
            const gas_price = await web3.eth.getGasPrice();
        
            let liquid_tx = {
                nounce: transactionCount,
                gasPrice: gas_price,
                from:  this.address_wallet,
                to: this.router_address,
                value:  web3.utils.toHex(web3.utils.toWei(amount_a, 'ether')),
                data:liquid_tx_data
            }
        
            liquid_tx['gas'] = await web3.eth.estimateGas(liquid_tx)
            let signed_tx = await web3.eth.accounts.signTransaction(liquid_tx, this.private_key)
            let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '') 
            lp_Balance = await pool_contract.methods.balanceOf(this.address_wallet).call()
            console.log(`wallet ${this.address_wallet} is Added ${formatEther(lp_Balance)} tokens to liquidity pool on Syncswap | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)   

        }catch(error) {
            console.log(error);
        }
    }

    public async burnLiquidity(a_token: string, b_token: string, amount_lp:string){
        try {
            const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
            this.address_wallet =  web3.eth.accounts.privateKeyToAccount(this.private_key).address
            // The factory of the Classic Pool.
            const classicPoolFactory = new web3.eth.Contract(
                this.factory_abi,
                this.factory_address
            );
    
            // Gets the address of the ETH/DAI Classic Pool.
            // wETH is used internally by the pools.
            const pool_address = await classicPoolFactory.methods.getPool(a_token,b_token).call();   
            // Checks whether the pool exists.
            if (pool_address === ethers.constants.AddressZero) {
                throw Error('Pool not exists');
            }
    
            // Gets the reserves of the pool.
            const pool_contract = new web3.eth.Contract(this.pool_abi,pool_address);
            let lp_Balance = await pool_contract.methods.balanceOf(this.address_wallet).call();
            console.log("lp_balance before:"+formatEther(lp_Balance));
            if(lp_Balance == 0) {
                throw Error('0 lp_balance burn"');;
            }
          
            let callback = ethers.constants.AddressZero        
            let lp_percent = parseInt(amount_lp)
            if(lp_percent == 0 || lp_percent > 100) {
                throw Error('lp_percent must be in 0 - 100"');;
            }
            const liquidity = BigNumber.from(lp_Balance).mul(BigNumber.from(lp_percent)).div(BigNumber.from(100))
        
            console.log(formatEther(liquidity))
        
            const liquidData = ethers.utils.defaultAbiCoder.encode(
                [ "address", "uint8"],
                [ this.address_wallet, 1], //to, withdraw mode
            );
          
            const minAmounts = [0,0]

            const router_contract = new web3.eth.Contract(this.router_abi, this.router_address);
        
            const reliquid_tx_data =  router_contract.methods.burnLiquidity(
                pool_address,
                liquidity,
                liquidData,
                minAmounts,
                callback,
                '0x').encodeABI()
        
        
            //console.log(reliquid_tx_data) 
            let reliquid_tx = {
                nounce: await web3.eth.getTransactionCount(this.address_wallet),
                gasPrice:  await web3.eth.getGasPrice(),
                from:  this.address_wallet,
                to: this.router_address,
                value:0,
                data:reliquid_tx_data
            }

            await erc20.approve(pool_address,this.address_wallet,this.router_address,this.private_key,web3)

        
            reliquid_tx['gas'] = await web3.eth.estimateGas(reliquid_tx)
            //reliquid_tx['gas'] = 2470000
        
            let signed_tx = await web3.eth.accounts.signTransaction(reliquid_tx, this.private_key)
            let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '') 

            let token_balance = await erc20.getBalance(b_token,this.address_wallet,web3)
            let after_balance = await pool_contract.methods.balanceOf(this.address_wallet).call()
            let burn_balance  = BigNumber.from(lp_Balance).sub(after_balance)

            console.log(`wallet ${this.address_wallet} added token_balance: ${token_balance} and remove ${formatEther(burn_balance)} tokens from liquidity pool on Syncswap | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)   
        }catch(error) {
            console.log(error);
        }

    }


}
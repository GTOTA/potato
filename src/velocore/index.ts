import Web3 from 'web3'
import * as ethers from "ethers";
import { BigNumber } from "ethers";

import { solidityPack, parseEther, parseUnits, formatUnits, formatEther } from "ethers/lib/utils";
import * as erc20 from '../utils/erc20'
import { sleep } from '../utils/time'
import { ERA_MAIN } from '../utils/token'

export class Velocore {
    private_key: string;
    amount_from: string;
    amount_to: string;
    router_address: string;
    factory_address: string;
    chain_rpc: string;
    address_wallet: string;

    factory_contract;
    vault_contract;

    vault_abi = require("../../abis/velocore/Vault.json")
    factory_abi = require("../../abis/velocore/Factory.json")

    constructor(private_key: string, router_address: string, factory_address: string, chain_rpc: string) {
        this.private_key = private_key
        this.router_address = router_address
        this.factory_address = factory_address
        this.chain_rpc = chain_rpc
    }

    readonly toToken = (spec: string, id: BigNumber | number, addr: string) =>
        solidityPack(
            ["uint8", "uint88", "address"],
            [["erc20", "erc721", "erc1155"].indexOf(spec), id, addr]
        )
    readonly poolId = (op: number, poolAddress: string) =>
        solidityPack(
            ["uint8", "uint88", "address"],
            [op, 0, poolAddress]
        )

    readonly tokenInformation = (index: number, amountType: string, amount: BigNumber) =>
        solidityPack(["uint8", "uint8", "uint112", "int128"], [
            index,
            ["exactly", "at most", "all"].indexOf(amountType),
            0,
            amount
        ]
        )

    readonly compileAndExecute = (value: BigNumber | number, ops) => {
        const tokenRef = [...new Set(ops.map(x => x[1].map(i => i[0])).flat())].sort();
        return this.vault_contract.methods.execute(
            tokenRef,
            (new Array(tokenRef.length)).fill(0),
            ops.map(op => ({
                poolId: op[0],
                tokenInformations: op[1].map(i => this.tokenInformation(tokenRef.indexOf(i[0]), i[1], i[2])).sort(),
                data: op[2] ?? "0x00"
            }))
        ).encodeABI();
    }

    readonly INT128_MAX = BigNumber.from("170141183460469231731687303715884105727");


    async swap(from_token: string, to_token: string, token: string, amountIn: string) {
        try {
            if (amountIn == null || amountIn.length == 0) {
                throw Error('swap value is null');
            }
            const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
            this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address

            let eth_balance = await web3.eth.getBalance(this.address_wallet)

            if (token.toUpperCase() === "ETH" && parseEther(amountIn).gt(eth_balance)) {
                throw Error('eth_balance not enough');
            }

            // The factory of the Classic Pool.
            this.factory_contract = new web3.eth.Contract(
                this.factory_abi,
                this.factory_address
            );

            this.vault_contract = new web3.eth.Contract(
                this.vault_abi,
                this.router_address
            );

            const eth = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
            let _from_token = token.toUpperCase() === "ETH" ? eth : this.toToken("erc20", 0, from_token);
            let _to_token = to_token === ERA_MAIN.eth_address ? eth : this.toToken("erc20", 0, to_token);

            const pool_address = await this.factory_contract.methods.pools(_from_token, _to_token).call()

            console.log(pool_address)
            const pool_token = this.toToken('erc20', 0, pool_address)


            var encode_data
            if (token.toUpperCase() === 'ETH') {
                //swap eth -> usdc, exact in
                encode_data = await this.compileAndExecute((parseEther(amountIn)), [
                    [this.poolId(0, pool_address), [
                        [_from_token, "all", this.INT128_MAX],
                        [_to_token, "at most", 0],
                    ]]
                ])
            } else {
                // swap usdc -> eth, exact in
                encode_data = await this.compileAndExecute((0), [
                    [this.poolId(0, pool_address), [
                        [_from_token, "exactly", parseUnits(amountIn,6)],
                        [_to_token, "at most", 0],
                    ]]
                ])
            }

            let swap_tx = {
                nounce: await web3.eth.getTransactionCount(this.address_wallet),
                gasPrice: await web3.eth.getGasPrice(),
                from: this.address_wallet,
                to: this.router_address,
                value: token.toUpperCase() === "ETH" ? web3.utils.toHex(web3.utils.toWei(amountIn, 'ether')) : 0,
                data: encode_data
            }

            //console.log(encode_data)

            if (token.toUpperCase() != "ETH") {
                await erc20.approve(from_token, this.address_wallet, this.router_address, this.private_key, web3)
            }

            swap_tx['gas'] = await web3.eth.estimateGas(swap_tx)

            

            let before_balance =  to_token === ERA_MAIN.eth_address ? eth_balance: await erc20.getBalance(to_token, this.address_wallet, web3)
            //console.log(`before swap,token_balance:${formatUnits(before_balance, 6)}`)

            let signed_tx = await web3.eth.accounts.signTransaction(swap_tx, this.private_key)
            let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')
            let after_balance =  to_token === ERA_MAIN.eth_address ? eth_balance : await erc20.getBalance(to_token, this.address_wallet, web3)
            let add_token = BigNumber.from(after_balance).sub(before_balance)
            console.log(`Velocore Waiting transaction from: ${this.address_wallet} added ${formatUnits(add_token, 6)} tokens on velocore | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`.green)


        } catch (error) {
            console.log(error)
        }
    }

    public async addLiquidity(a_token: string, b_token: string, token: string, amount_a: string, amount_b: string) {
        try {
            if (amount_a == null || amount_a.length == 0) {
                throw Error('swap value is null');
            }
            const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
            this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address

            let eth_balance = await web3.eth.getBalance(this.address_wallet)
            let token_balance = await erc20.getBalance(b_token, this.address_wallet, web3)

            console.log(`wallet eth balance:${eth_balance},token_balance:${token_balance}`)

            if (token.toUpperCase() === "ETH") {
                if (parseEther(amount_a).gt(eth_balance))
                    throw Error('eth_balance not enough');
                if (parseUnits(amount_b, 6).gt(token_balance))
                    throw Error('token_balance not enough');
            }


            // The factory of the Classic Pool.
            this.factory_contract = new web3.eth.Contract(
                this.factory_abi,
                this.factory_address
            );

            this.vault_contract = new web3.eth.Contract(
                this.vault_abi,
                this.router_address
            );

            const eth = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
            let _from_token = token.toUpperCase() === "ETH" ? eth : this.toToken("erc20", 0, a_token);
            let _to_token = this.toToken("erc20", 0, b_token);
            let vc_token = this.toToken("erc20", 0, ERA_MAIN.vc_adress);
            const pool_address = await this.factory_contract.methods.pools(_from_token, _to_token).call()
            const pool_token = this.toToken('erc20', 0, pool_address)

            const tradingamount = ethers.utils.parseEther(amount_a);

            console.log(amount_a)
            console.log(amount_b)

            // add liquidity and stake usdc-eth == "buying lp token and paying usdc and eth"
            // const encode_data =  await this.compileAndExecute(tradingamount, [
            //     [this.poolId(0, pool_address), [ // deposit lp
            //         [_from_token, "exactly", tradingamount],
            //         [_to_token, "all", ethers.utils.parseUnits(amount_b,6)],
            //         [pool_token, "at most", 0]
            //     ]],
            //     [this.poolId(1, pool_address), [ // stake
            //         [pool_token, "all", this.INT128_MAX],
            //         [vc_token, "at most", 0]
            //     ]]
            // ]);

            // add liquidity and stake usdc-eth, using single token
            const encode_data = await this.compileAndExecute(tradingamount, [
                [this.poolId(0, pool_address), [ // deposit lp
                    [_from_token, "exactly", tradingamount],
                    [pool_token, "at most", 0]
                ]],
                [this.poolId(1, pool_address), [ // stake
                    [pool_token, "all", this.INT128_MAX],
                    [vc_token, "at most", 0] // vc must be included to receive emissions. it will revert otherwise
                ]]
            ])

            if (token.toUpperCase() === "ETH") {
                await erc20.approve(b_token, this.address_wallet, this.router_address, this.private_key, web3)
            } else {
                await erc20.approve(a_token, this.address_wallet, this.router_address, this.private_key, web3)
            }

            let liquid_tx = {
                nounce: await web3.eth.getTransactionCount(this.address_wallet),
                gasPrice: await web3.eth.getGasPrice(),
                from: this.address_wallet,
                to: this.router_address,
                value: web3.utils.toHex(web3.utils.toWei(amount_a, 'ether')),
                data: encode_data
            }

            liquid_tx['gas'] = await web3.eth.estimateGas(liquid_tx)
            let signed_tx = await web3.eth.accounts.signTransaction(liquid_tx, this.private_key)
            let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

            eth_balance = await web3.eth.getBalance(this.address_wallet)
            token_balance = await erc20.getBalance(b_token, this.address_wallet, web3)
            console.log(`wallet eth balance:${eth_balance},token_balance:${token_balance}`)

            let lp_Balance = await erc20.getBalance(pool_address, this.address_wallet, web3)
            console.log(`wallet ${this.address_wallet} is Added ${formatEther(lp_Balance)} tokens to liquidity pool on velocore | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)

            const gaugeABI = require('../../abis/velocore/IGauge.json');
            const gauge = new web3.eth.Contract(gaugeABI, pool_address);
            // unstake and remove liquidity to usdc
            let stakedAmount = (await gauge.methods.stakedTokens(this.address_wallet).call())[0]
            console.log("stakedAmount:" + stakedAmount.toString())
            console.log("negstake:" + BigNumber.from('0').sub(stakedAmount).toString())

        } catch (error) {
            console.log(error)
        }

    }

    public async burnLiquidity(a_token: string, b_token: string, token: string, amount_lp: string) {
        try {
            let lp_percent = parseInt(amount_lp)
            if (lp_percent == 0 || lp_percent > 100) {
                throw Error('lp_percent must be in 0 - 100"')
            }
            const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
            this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address

            let eth_balance = await web3.eth.getBalance(this.address_wallet)
            let token_balance = await erc20.getBalance(b_token, this.address_wallet, web3)

            console.debug(`wallet eth balance:${eth_balance},token_balance:${token_balance}`)

            // The factory of the Classic Pool.
            this.factory_contract = new web3.eth.Contract(
                this.factory_abi,
                this.factory_address
            );

            this.vault_contract = new web3.eth.Contract(
                this.vault_abi,
                this.router_address
            );

            const eth = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
            let _from_token = token.toUpperCase() === "ETH" ? eth : this.toToken("erc20", 0, a_token);
            let _to_token = this.toToken("erc20", 0, b_token);
            let vc_token = this.toToken("erc20", 0, ERA_MAIN.vc_adress);
            const pool_address = await this.factory_contract.methods.pools(_from_token, _to_token).call()
            const pool_token = this.toToken('erc20', 0, pool_address)


            const gaugeABI = require('../../abis/velocore/IGauge.json');
            const gauge = new web3.eth.Contract(gaugeABI, pool_address);
            // unstake and remove liquidity to usdc
            let stakedAmount = (await gauge.methods.stakedTokens(this.address_wallet).call())[0]
            const liquidity = BigNumber.from(stakedAmount).mul(BigNumber.from(lp_percent)).div(BigNumber.from(100))
            console.debug("stakedAmount:" + stakedAmount.toString())
            console.debug("negstake:" + BigNumber.from('0').sub(liquidity).toString())

            // add liquidity and stake usdc-eth, using single token
            const encode_data = await this.compileAndExecute(0, [
                [this.poolId(1, pool_address), [ // unstake
                    [pool_token, "exactly", BigNumber.from('0').sub(liquidity).toString()],
                    [vc_token, "at most", 0] // vc must be included to receive emissions. it will revert otherwise
                ]],
                [this.poolId(0, pool_address), [ // remove lp
                    [_from_token, "at most", 0],
                    [_to_token, "at most", 0],  // uncomment to receive both eth and usdc in proportion
                    [pool_token, "all", this.INT128_MAX]
                ]],
            ])

            await erc20.approve(pool_address, this.address_wallet, this.router_address, this.private_key, web3)

            let liquid_tx = {
                nounce: await web3.eth.getTransactionCount(this.address_wallet),
                gasPrice: await web3.eth.getGasPrice(),
                from: this.address_wallet,
                to: this.router_address,
                value: 0,
                data: encode_data
            }

            liquid_tx['gas'] = await web3.eth.estimateGas(liquid_tx)

            let signed_tx = await web3.eth.accounts.signTransaction(liquid_tx, this.private_key)
            let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

            eth_balance = await web3.eth.getBalance(this.address_wallet)
            token_balance = await erc20.getBalance(b_token, this.address_wallet, web3)
            console.debug(`wallet eth balance:${eth_balance},token_balance:${token_balance}`)

            //let vcBalance = await erc20.getBalance(vc_token, this.address_wallet, web3)
            //console.debug('vcBalance:' + ethers.utils.formatEther(vcBalance));

            stakedAmount = (await gauge.methods.stakedTokens(this.address_wallet).call())[0]
            console.log(`wallet ${this.address_wallet} remove ${stakedAmount} tokens to liquidity pool on velocore | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)
        } catch (error) {
            console.log(error)
        }
    }

    public async vote(a_token: string, b_token: string, token: string, lock_address: string, vote_address: string, vc_amount: string) {
        try {
            let vc_percent = parseInt(vc_amount)
            if (vc_percent == 0 || vc_percent > 100) {
                throw Error('lp_percent must be in 0 - 100"');;
            }
            const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
            this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address

            let eth_balance = await web3.eth.getBalance(this.address_wallet)
            let token_balance = await erc20.getBalance(b_token, this.address_wallet, web3)

            console.debug(`wallet eth balance:${eth_balance},token_balance:${token_balance}`)

            // The factory of the Classic Pool.
            this.factory_contract = new web3.eth.Contract(
                this.factory_abi,
                this.factory_address
            );

            this.vault_contract = new web3.eth.Contract(
                this.vault_abi,
                this.router_address
            );

            let vc_token = this.toToken("erc20", 0, lock_address)
            let vevc_token = this.toToken("erc20", 0, vote_address)

            let veBalance = await erc20.getBalance(lock_address, this.address_wallet, web3)
            if (veBalance == 0) {
                throw Error('ve balance not enough"');;
            }
            const lock_vc = BigNumber.from(veBalance).mul(BigNumber.from(vc_percent)).div(BigNumber.from(100))

            //lock vc
            const encode_data = await this.compileAndExecute(0, [
                [this.poolId(0, vote_address), [
                    [vc_token, "exactly", lock_vc],
                    [vevc_token, "at most", 0],
                ]],
            ])

            let lock_tx = {
                nounce: await web3.eth.getTransactionCount(this.address_wallet),
                gasPrice: await web3.eth.getGasPrice(),
                from: this.address_wallet,
                to: this.router_address,
                value: 0,
                data: encode_data
            }
            await erc20.approve(lock_address, this.address_wallet, this.router_address, this.private_key, web3)

            lock_tx['gas'] = await web3.eth.estimateGas(lock_tx)

            let signed_tx = await web3.eth.accounts.signTransaction(lock_tx, this.private_key)
            let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

            let vevcBalance = await erc20.getBalance(vote_address, this.address_wallet, web3);
            console.log(`wallet ${this.address_wallet} lock ${vevcBalance} tokens  on velocore | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)

            // vote
            const eth = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
            let _from_token = token.toUpperCase() === "ETH" ? eth : this.toToken("erc20", 0, a_token)
            let _to_token = this.toToken("erc20", 0, b_token)
            const pool_address = await this.factory_contract.methods.pools(_from_token, _to_token).call()

            const vote_data = await this.compileAndExecute(0, [
                [this.poolId(3, pool_address), [
                    [vevc_token, "exactly", lock_vc],
                ]],
            ])
            let vote_tx = {
                nounce: await web3.eth.getTransactionCount(this.address_wallet),
                gasPrice: await web3.eth.getGasPrice(),
                from: this.address_wallet,
                to: this.router_address,
                value: 0,
                data: vote_data
            }
            await erc20.approve(pool_address, this.address_wallet, this.router_address, this.private_key, web3)

            vote_tx['gas'] = await web3.eth.estimateGas(vote_tx)
            signed_tx = await web3.eth.accounts.signTransaction(vote_tx, this.private_key)
            raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

            vevcBalance = await erc20.getBalance(vote_address, this.address_wallet, web3);
            console.log(`wallet ${this.address_wallet} vote ${vevcBalance} tokens  on velocore | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)

            //unvote
            const unvote_data = await this.compileAndExecute(0, [
                [this.poolId(3, pool_address), [
                    [vevc_token, "exactly", lock_vc],
                ]],
            ])

            let unvote_tx = {
                nounce: await web3.eth.getTransactionCount(this.address_wallet),
                gasPrice: await web3.eth.getGasPrice(),
                from: this.address_wallet,
                to: this.router_address,
                value: 0,
                data: unvote_data
            }

            unvote_tx['gas'] = await web3.eth.estimateGas(unvote_tx)
            signed_tx = await web3.eth.accounts.signTransaction(unvote_tx, this.private_key)
            raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

            vevcBalance = await erc20.getBalance(vote_address, this.address_wallet, web3);
            console.log(`wallet ${this.address_wallet} unvote ${vevcBalance} tokens  on velocore | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`)
        } catch (error) {
            console.error(error)
        }
    }
}
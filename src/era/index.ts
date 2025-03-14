
import Web3 from 'web3'
import { parseEther } from "ethers/lib/utils";

export class EraNameServie {
    router_address:string;
    address_wallet:string;
    chain_rpc:string;
    private_key:string;

    router_abi = require('../../abis/era-name/era-name.json')


    constructor(private_key: string, router_address: string, chain_rpc: string) {
        this.private_key = private_key
        this.router_address = router_address
        this.chain_rpc = chain_rpc
    }

    public async resolveAddress(address:string) {
        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);
        let tx = await router_contract.methods.resolveAddress(address).call()
        console.log(`resolveAddress transaction: ${address} | TX: https://explorer.zksync.io/tx/${tx.transactionHash}`);
    }

    public async regist(era_name:string) {
        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))

        this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address
        let eth_balance = await web3.eth.getBalance(this.address_wallet)

        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);
        const tx_data = await router_contract.methods.Register(era_name).encodeABI()

        let tx = {
            nounce: await web3.eth.getTransactionCount(this.address_wallet),
            gasPrice: await web3.eth.getGasPrice(),
            from: this.address_wallet,
            to: this.router_address,
            value: web3.utils.toHex(web3.utils.toWei('0.03', 'ether')),
            data: tx_data
        };

        let gasLimit = await web3.eth.estimateGas(tx)
        tx['gas'] = gasLimit

        let signed_tx = await web3.eth.accounts.signTransaction(tx, this.private_key)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

        console.log(`regist transaction: ${era_name} ${ this.address_wallet} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);
    }

    public async setPrimaryAddress(era_name:string){
        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))

        this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address
        let eth_balance = await web3.eth.getBalance(this.address_wallet)

        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);
        const tx_data = await router_contract.methods.setPrimaryAddress(era_name).encodeABI()

        let tx = {
            nounce: await web3.eth.getTransactionCount(this.address_wallet),
            gasPrice: await web3.eth.getGasPrice(),
            from: this.address_wallet,
            to: this.router_address,
            value: 0,
            data: tx_data
        };

        let gasLimit = await web3.eth.estimateGas(tx)
        tx['gas'] = gasLimit

        let signed_tx = await web3.eth.accounts.signTransaction(tx, this.private_key)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

        console.log(`setPrimaryAddress transaction: ${era_name} ${ this.address_wallet} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);
    }

    

    public async getPrimaryAddress(era_name:string) {
        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);
        let tx = await router_contract.methods.getPrimaryAddress(era_name).call()
        console.log(`getPrimaryAddress transaction: ${era_name}  | TX: https://explorer.zksync.io/tx/${tx.transactionHash}`);
    }

    public async setDataAddress(era_name:string,data_name:string,data_value:string) {
        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))

        this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address
        let eth_balance = await web3.eth.getBalance(this.address_wallet)

        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);
        const tx_data = await router_contract.methods.setDataAddress(era_name,data_name,data_value).encodeABI()

        let tx = {
            nounce: await web3.eth.getTransactionCount(this.address_wallet),
            gasPrice: await web3.eth.getGasPrice(),
            from: this.address_wallet,
            to: this.router_address,
            value: 0,
            data: tx_data
        };

        let gasLimit = await web3.eth.estimateGas(tx)
        tx['gas'] = gasLimit

        let signed_tx = await web3.eth.accounts.signTransaction(tx, this.private_key)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

        console.log(`setDataAddress transaction: ${era_name} ,${data_name} ${data_value} ${this.address_wallet} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);

    }

    public async getDataAddress(era_name:string,data_name:string){

        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);
        let tx = await router_contract.methods.getDataAddress(era_name,data_name).call()
        console.log(`getDataAddress transaction: ${era_name} ,${data_name}  | TX: https://explorer.zksync.io/tx/${tx.transactionHash}`);
    }
}



import Web3 from 'web3'
import { ZKS_NAME_ERA_MAIN } from './config'

export class ZksNameService {
    router_address:string;
    address_wallet:string;
    chain_rpc:string;
    private_key:string;

    router_abi = require('../../abis/zks/zks.json')


    constructor(private_key: string, router_address: string, chain_rpc: string) {
        this.private_key = private_key
        this.router_address = router_address
        this.chain_rpc = chain_rpc
    }


    public async regist(era_name:string) {
        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))

        this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address
        let eth_balance = await web3.eth.getBalance(this.address_wallet)

        let router_contract = new web3.eth.Contract(this.router_abi, this.router_address);
        const tx_data = await router_contract.methods.register(era_name,this.address_wallet,1).encodeABI()

        let tx = {
            nounce: await web3.eth.getTransactionCount(this.address_wallet),
            gasPrice: await web3.eth.getGasPrice(),
            from: this.address_wallet,
            to: this.router_address,
            value: 0,
            data: tx_data
        };

        console.log(tx)

        let gasLimit = await web3.eth.estimateGas(tx)
        tx['gas'] = gasLimit

        let signed_tx = await web3.eth.accounts.signTransaction(tx, this.private_key)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

        console.log(`regist transaction: ${era_name} ${ this.address_wallet} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);
    }

    public async setPrimaryDomain(era_name:string){
        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))

        this.address_wallet = web3.eth.accounts.privateKeyToAccount(this.private_key).address

        let router_contract = new web3.eth.Contract(this.router_abi,  ZKS_NAME_ERA_MAIN.BASE_ZKNAME_ADDRESS);
        let tokenId = (web3.utils.keccak256(era_name))
        const tx_data = await router_contract.methods.setPrimaryDomain(tokenId).encodeABI()

        
        let tx = {
            nounce: await web3.eth.getTransactionCount(this.address_wallet),
            gasPrice: await web3.eth.getGasPrice(),
            from: this.address_wallet,
            to: ZKS_NAME_ERA_MAIN.BASE_ZKNAME_ADDRESS,
            value: 0,
            data: tx_data
        };

        let gasLimit = await web3.eth.estimateGas(tx)
        tx['gas'] = gasLimit

        console.log(tx)

        let signed_tx = await web3.eth.accounts.signTransaction(tx, this.private_key)
        let raw_tx_hash = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction || '')

        console.log(`setPrimaryAddress transaction: ${era_name} ${ this.address_wallet} | TX: https://explorer.zksync.io/tx/${raw_tx_hash.transactionHash}`);
    }

    

    public async getPrimaryDomainName(user_address:string) {
        const web3 = new Web3(new Web3.providers.HttpProvider(this.chain_rpc))
        let router_contract = new web3.eth.Contract(this.router_abi,  ZKS_NAME_ERA_MAIN.BASE_ZKNAME_ADDRESS);
        let tx = await router_contract.methods.getPrimaryDomainName(user_address).call()
        console.log(`getPrimaryAddress transaction: ${user_address}  | TX: https://explorer.zksync.io/tx/${tx.transactionHash}`);
    }

   
}


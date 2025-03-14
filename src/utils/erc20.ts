
import Web3 from 'web3'
 
const ERC20ABI = require("../../abis/erc-20.json")

export async function getBalance(tokenAddress : string, myAddress:string,web3: Web3 ) {
    const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
    return tokenContract.methods.balanceOf(myAddress).call()
}

export async function getDecimals(tokenAddress : string,web3: Web3 ) {
    const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
    return tokenContract.methods.decimals().call()
}

export async function approve(tokenAddress: string, myAddress: string, spender: string, private_key: string,web3: Web3 ){
    const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
    let nounce = await web3.eth.getTransactionCount(myAddress);
    const tokenBalance = await tokenContract.methods.balanceOf(myAddress).call()
    let data = await tokenContract.methods.approve(spender, tokenBalance).encodeABI();
    let gasPrice = await web3.eth.getGasPrice();

    const gasLimit = 2100000;
    let tx = {
        nounce,
        gasPrice,
        gasLimit,
        to: tokenAddress,
        value: 0,
        data
    };
    const signedTx = await web3.eth.accounts.signTransaction(tx, private_key);
    const signtx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction || '');
    console.debug(`approve token ${tokenAddress} balance ${tokenBalance} signtx:${signtx.transactionHash}` )
    //console.log('tx: ', signtx);
}
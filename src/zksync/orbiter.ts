import { Bridge, BridgeChain, BridgeToken } from 'orbiter-sdk'
import { BigNumber, BigNumberish, ethers, utils } from 'ethers'
import Web3 from 'web3';


const zksync_op_usdc_maker = "0x41d3D33156aE7c62c094AAe2995003aE63f587B3"
const zksync_op_eth_maker = "0x80C67432656d59144cEFf962E8fAF8926599bCF8"


export declare enum ChainId {
    None = -1,
    EthereumMainnet = 1,
    Optimism = 10,
    ZkSyncEra = 324,
    BSC = 56,
    ETC = 61,
    Aurora = 1313161554,
    Matic = 137,
    Arbitrum = 42161,
    Cronos = 25,
    Icplaza = 142857,
    ConfluxESpace = 1030,
    Meter = 82,
    Telos = 40,
    Ontology = 58,
    Ultron = 1231,
    Mantle = 5000,
    Base = 8453,
    Linea = 59144,
    Loot = 5151706,
    OpBNB = 204,
    Kroma = 255,
    Rinkeby = 4,
    Goerli = 5,
    BSCTestnet = 97,
    OntologyTestnet = 5851,
    MaticTestnet = 80001,
    AuroraTestnet = 1313161555,
    ZkSyncAlphaTest = 280,
    MantleTest = 5001,
    ScrollTestL2 = 534351,
    LineaTest = 59140,
    MantaTest = 3441005,
    StagingFastActiveBellatrix = 1351057110,
    KromaSepoliaTest = 2358
}

const currentFromChain: BridgeChain = {
    id: 3,
    name: 'zksync',
    networkId: ChainId.ZkSyncEra,
    icon: ''
}

const currentToChain: BridgeChain = {
    id: 7,
    name: 'optimism',
    networkId: ChainId.Optimism,
    icon: ''
}


const usdcAbi = require('../../abis/erc-20.json')
const usdcAddress = '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4'

//const wethContract = new ethers.Contract(wethAddress, wethAbi, provider)


// methods
const bridge = new Bridge('Mainnet')

const refreshBridgeSupports = async () => {
    const supports = await bridge.supports(currentFromChain, currentToChain)
    console.log(supports.fromChains)
    console.log(supports.toChains)
}

const fetchToken = async (tokenAddr: string, chain: number, web3: Web3): Promise<BridgeToken> => {
    const contract =new ethers.Contract(usdcAddress, usdcAbi, web3.givenProvider)
    const decimal = Number(await contract.methods.decimals().call());
    //const symbol = await contract.methods.symbol().call();
    const name = await contract.methods.name().call();
    const tokenInfo: BridgeToken = {
        chainId: chain,
        name: name,
        address: tokenAddr,
        precision: decimal,
        makerAddress: '',
        icon: ''
    };
    return tokenInfo;
};


export default async function () {

    const privateKey = ""
    const rpc = "http://127.0.0.1:8011"
    //const rpc = "https://dry-powerful-flower.zksync-mainnet.quiknode.pro/9ecc33f50aff0552904e8f43cd595c5c4b6d17f2/"
    console.log('rpc: ', rpc)
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc))

    const account = web3.eth.accounts.privateKeyToAccount(privateKey)

    console.log('address: ', account.address)

    const usdcAddress = '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4'
    const wethAddress = '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91'

    await refreshBridgeSupports()

    let currentToken: BridgeToken = await fetchToken(wethAddress, ChainId.ZkSyncEra, web3)
    currentToken.makerAddress = zksync_op_eth_maker

    const provider = new ethers.providers.JsonRpcProvider(rpc)
    const signer = new ethers.Wallet(privateKey, provider);

    let amountIn = "0.001"
    let amountOut
    try {
        amountOut = await bridge.getAmounts(
            currentToken,
            currentFromChain,
            currentToChain,
            amountIn
        )
    } catch (err) {
        console.log(err)
    }

    console.log("amountOut" + amountOut)

    const result = await bridge.transfer(
        signer,
        currentToken,
        currentFromChain,
        currentToChain,
        amountIn,
    )
    console.log(result)

}



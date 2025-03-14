import { solidityPack, parseEther,parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";

import * as zksync from "zksync-web3";
import * as ethers from "ethers";


// load env file
import dotenv from "dotenv";
import { getContract } from "@thirdweb-dev/sdk";
dotenv.config();

// For SELL contract
const ERC20ABI = require("../../abis/erc-20.json")
const classicVaultAbi = require("../../abis/velocore/Vault.json")
const classicPoolFactoryAbi = require("../../abis/velocore/Factory.json")

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";


const WALLET_ADDRESS = "0xCff4De693fDCDDD00517B3cbE6769CC0C052F770";
if (!WALLET_ADDRESS) 
    throw "⛔️ WALLET_ADDRESS address not provided";

const ConstantProductPoolFactoryAddress = "0x544D7D954f7c8f3dF1b0ffCE0736647Eab6a5232"
const VaultAddress = "0xf5E67261CB357eDb6C7719fEFAFaaB280cB5E2A6"

 
async function approvalToken(wallet,tokenaddress,routeaddress){
    //const provider = new Provider("https://testnet.era.zksync.dev");
    const erc20Contract = new ethers.Contract(tokenaddress, ERC20ABI, wallet);
    var wallet_address =  await wallet.getAddress();
    var balance = await erc20Contract.balanceOf(wallet_address);

    console.log(' balance of usdc:'+ ethers.utils.formatUnits(balance, 6));

    let allowance = await erc20Contract.allowance(wallet_address, routeaddress)
    console.log(`Waiting transaction approval: ${wallet_address} allowance: ${allowance}`);

    if (allowance.lte(balance)) {
        console.log("-----------approve-------------")
        let res = await erc20Contract.approve(routeaddress, balance)
        return res.wait()
    }
}

// 从原生ETH换成其它币。
async function swapEthToToken(_router, _tokenIn, _tokenOut, _amount, _wallet, _isStable=false){
    const factoryAddress = await _router.factory();
    const routes = [
        {
            from: _tokenIn,
            to: _tokenOut,
            stable: _isStable,
            factory: factoryAddress
        }
    ];
    const params = {
        value:_amount
    };
    const response = await _router.swapExactETHForTokens(
        BigNumber.from(0), 
        routes,
        _wallet.address,
        BigNumber.from(Math.floor(Date.now() / 1000)).add(1800),
        params 
        )
    return await response.wait();
};

// token之间互相交易
async function swapTokenToToken(_router, _tokenIn, _tokenOut, _amount, _wallet, _isStable=false){
    const factoryAddress = await _router.factory();
    const routes = [
        {
            from: _tokenIn,
            to: _tokenOut,
            stable: _isStable,
            factory: factoryAddress
        }
    ];
    const response = await _router.swapExactTokensForTokens(
        _amount,
        BigNumber.from(0), 
        routes,
        _wallet.address,
        BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)
        )
    return await response.wait();
};

// 从其他币换成ETH
async function swapTokenToETH(_router, _tokenIn, _tokenOut, _amount, _wallet, _isStable=false){
    const factoryAddress = await _router.factory();
    const routes = [
        {
            from: _tokenIn,
            to: _tokenOut,
            stable: _isStable,
            factory: factoryAddress
        }
    ];
    const params = {
        gasLimit: 800000 

    };
    const response = await _router.swapExactTokensForETH(
        _amount,
        ethers.utils.parseEther('0.0003'), 
        routes,
        _wallet.address,
        BigNumber.from(Math.floor(Date.now() / 1000)).add(1800),
        params
    )
    return await response.wait();
};


const floatToFixed = (num, decimals = 18) => {
    return BigNumber.from(ethers.utils.parseUnits(num.toString(), decimals));
  };

async function addLiquidityToPool(_router, _pool, _tokenAAmount, _tokenBAmount, _tokenid=0, _kind=0){
    const tx = await _router.addLiquidityToPool(
        _pool,
        _tokenid,
        [
          {
            kind: _kind,
            isDelta: true,
            pos: 0,
            deltaA: floatToFixed(500),
            deltaB: floatToFixed(500),
          },
        ],
        0,
        0,
        ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800)
      );
};


export default async function (hre) {
    //const provider = new zksync.Provider(" https://mainnet.era.zksync.io");
    const provider = new zksync.Provider(hre.userConfig.networks?.zkSyncTestnet?.url);

    console.log(hre.userConfig.networks?.zkSyncTestnet?.url);

    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    var balance = await signer.getBalance();
    console.log(' balance before swap:'+ ethers.utils.formatEther(balance));

       // The factory of the Classic Pool.
    const factory = new ethers.Contract(
        ConstantProductPoolFactoryAddress,
        classicPoolFactoryAbi,
        signer
    );

    const vault = new ethers.Contract(
        VaultAddress,
        classicVaultAbi,
        signer
    );

    // Gets the address of the ETH/DAI Classic Pool.
    // wETH is used internally by the pools.

    const toToken = (spec: string, id: BigNumber | number, addr: string) =>
        solidityPack(
            ["uint8", "uint88", "address"],
            [["erc20", "erc721", "erc1155"].indexOf(spec), id, addr]
        )
    const poolId = (op: number, poolAddress: string) =>
        solidityPack(
            ["uint8", "uint88", "address"],
            [op, 0, poolAddress]
        )

    const tokenInformation = (index: number, amountType: string, amount: BigNumber) =>
        solidityPack(["uint8", "uint8", "uint112", "int128"], [
            index,
            ["exactly", "at most", "all"].indexOf(amountType),
            0,
            amount
        ]
        )

    const compileAndExecute = (value: BigNumber | number, ops) => {
        const tokenRef = [...new Set(ops.map(x => x[1].map(i => i[0])).flat())].sort();
        console.log(tokenRef)
        console.log((new Array(tokenRef.length)).fill(0))
        console.log("value:"+ethers.utils.formatEther(value))

        let tok = ops[0][1].map(i => tokenInformation(tokenRef.indexOf(i[0]), i[1], i[2]))
        console.log(tok)
    
        return vault.execute(
            tokenRef,
            (new Array(tokenRef.length)).fill(0),
            ops.map(op => ({
                poolId: op[0],
                tokenInformations: op[1].map(i => tokenInformation(tokenRef.indexOf(i[0]), i[1], i[2])).sort(),
                data: op[2] ?? "0x00"
            }))
            , { value, gasLimit: 1647485, gasPrice: ethers.utils.parseUnits('0.25', 'gwei'),}
        );
    }

    const vevc_address = "0x3cD3e41fF4B95a8DdC915F3c7615AB6f2B478c33";
    const usdc_address = "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4";

    console.log("START ---USDC POOL")

    const vc = toToken("erc20", 0, "0x99bBE51be7cCe6C8b84883148fD3D12aCe5787F2");
    const vevc = toToken("erc20", 0, "0x3cD3e41fF4B95a8DdC915F3c7615AB6f2B478c33");
    const usdc = toToken("erc20", 0, "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4");
    const dai = toToken("erc20", 0, "0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b");
    const weth = toToken("erc20", 0, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91");
    const eth = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    const INT128_MAX = BigNumber.from("170141183460469231731687303715884105727");

    const usdc_eth_pool = await factory.pools(eth, usdc);
     const vc_eth_pool = await factory.pools(eth, vc);
    //const dai_eth_pool = await factory.pools(eth, dai);
    const usdc_eth_lp = toToken('erc20', 0, usdc_eth_pool);

    const weth_eth_pool = await factory.pools(eth, weth);

    console.log(" POOL:"+ usdc_eth_pool)
     // // 创建router合约
     const routerABI = require('../../abis/velocore/Router.json');
     const classicRouter = new zksync.Contract("0xd999E16e68476bC749A28FC14a0c3b6d7073F50c", routerABI, signer);
     // // // 将ETH换成USDC
     var randomAmount = "0.002";
     const tradingamount = ethers.utils.parseEther(randomAmount);
     console.log('开始将ETH兑换为USDC  兑换数量：', randomAmount)
    //let tx = await swapEthToToken(classicRouter, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91","0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4" , tradingamount, signer);

    //查询USDC余额
    //console.log('开始查询余额。。。')
    //let tokenBalance = await provider.getBalance(signer.address, "latest", "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4");
    //console.log('tokenBalance', tokenBalance.toString());

     // 
     //console.log('开始授权。。。')
     //await approvalToken(signer, usdc_address, "0xd999E16e68476bC749A28FC14a0c3b6d7073F50c");

    // console.log('将USDC兑换为ETH')
     //let tx = await swapTokenToETH(classicRouter, "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4", "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", tokenBalance, signer);
    //approvalToken(signer,"0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4");
    let tx;

     //swap eth -> vc, exact in
    // tx = await compileAndExecute((tradingamount), [
    //     [poolId(0, vc_eth_pool), [    
    //         [eth, "all", INT128_MAX],
    //         [vc, "at most",  parseEther("0.002")],
    //     ]],
    // ])

    // console.log(tx)
    //swap eth -> usdc, exact in
    // tx = await compileAndExecute((tradingamount), [
    //     [poolId(0, usdc_eth_pool), [    
    //         [eth, "all", INT128_MAX],
    //         [usdc, "at most", parseEther("3")],
    //     ]],
    //     [poolId(5, weth_eth_pool), [    
    //         [usdc, "at most", parseEther("3")],
    //     ]]
    // ])


    await approvalToken(signer, usdc_address, "0x943ac2310D9BC703d6AB5e5e76876e212100f894");

    console.log(tx)    
    // 授权USDC
    //await approvalToken(signer, usdc_address, VaultAddress);
    //await approvalToken(signer, "0x99bBE51be7cCe6C8b84883148fD3D12aCe5787F2", VaultAddress);

    randomAmount = '0.0006';
    //add liquidity and stake usdc-eth == "buying lp token and paying usdc and eth"
    tx =  await compileAndExecute(parseEther(randomAmount), [
        [poolId(0, usdc_eth_pool), [ // deposit lp
            [eth, "exactly", parseEther(randomAmount)],
            [usdc, "all", ethers.utils.parseUnits("1",6)],
            [usdc_eth_lp, "at most", 0]
        ]],
        [poolId(1, usdc_eth_pool), [ // stake
            [usdc_eth_lp, "all", INT128_MAX],
            [vc, "at most", 0]
        ]]
    ])

     // add liquidity and stake usdc-eth, using single token
    // tx = await compileAndExecute(0, [
    //     [poolId(0, usdc_eth_pool), [ // deposit lp
    //         [usdc, "exactly", parseUnits("1",6)],
    //         [usdc_eth_lp, "at most", 0]
    //     ]],
    //     [poolId(1, usdc_eth_pool), [ // stake
    //         [usdc_eth_lp, "all", INT128_MAX],
    //         [vc, "at most", 0] // vc must be included to receive emissions. it will revert otherwise
    //     ]]
    // ])

    //harvest -> swap -> compound
    // tx = await compileAndExecute(0, [
    //     [poolId(1, usdc_eth_pool), [ //harvest
    //         [vc, "at most", 0] // vc must be included to receive emissions. it will revert otherwise
    //     ]],
    //     [poolId(0, vc_eth_pool), [ // swap
    //         [vc, "all", INT128_MAX],
    //         [eth, "at most", 0],
    //     ]],
    //     [poolId(0, usdc_eth_pool), [ // deposit lp
    //         [eth, "all", INT128_MAX],
    //         [usdc_eth_lp, "at most", 0]
    //     ]],
    //     [poolId(1, usdc_eth_pool), [ // stake
    //         [usdc_eth_lp, "all", INT128_MAX],
    //         [vc, "at most", 0] // vc must be included to receive emissions. it will revert otherwise
    //     ]]
    // ])


    // const gaugeABI = require('../../abis/velocore/IGauge.json');
    // const gauge = new ethers.Contract(usdc_eth_pool, gaugeABI, provider);
    // // unstake and remove liquidity to usdc
    // let stakedAmount = (await gauge.stakedTokens(signer.address))[0]
    // console.log("stakedAmount:"+stakedAmount.toString())
    // console.log("negstake:"+ BigNumber.from('0').sub(stakedAmount).toString())


    // tx = await compileAndExecute(0, [
    //      [poolId(1, usdc_eth_pool), [ // unstake
    //          [usdc_eth_lp, "exactly", BigNumber.from('0').sub(stakedAmount)],
    //          [vc, "at most", 0] // vc must be included to receive emissions. it will revert otherwise
    //      ]],
    //      [poolId(0, usdc_eth_pool), [ // remove lp
    //          [usdc, "at most", 0],
    //          [eth, "at most", 0],  // uncomment to receive both eth and usdc in proportion
    //          [usdc_eth_lp, "all", INT128_MAX]
    //      ]],
    //  ])


    // let vcBalance = await provider.getBalance(signer.address, "latest", "0x99bBE51be7cCe6C8b84883148fD3D12aCe5787F2");
    // console.log('vcBalance:'+ ethers.utils.formatEther(vcBalance));
    // console.log("lock vc---------------:"+vcBalance)

    // // lock vc
    // tx = await compileAndExecute(0, [
    //     [poolId(0, vevc_address), [
    //         [vc, "exactly", parseEther("0.001")],
    //         [vevc, "at most", 0],
    //     ]],
    // ])
    // console.log(tx)

    // let vevcBalance = await provider.getBalance(signer.address, "latest", "0x3cD3e41fF4B95a8DdC915F3c7615AB6f2B478c33");
    // console.log('vevcBalance:'+ ethers.utils.formatEther(vevcBalance));
    // console.log("vote vevc---------------:"+vevcBalance)
    // // vote
    // tx = await compileAndExecute(0, [
    //     [poolId(3, usdc_eth_pool), [
    //         [vevc, "exactly", parseEther("0.001")],
    //     ]],
    // ])

    // //console.log(tx)
    // // unvote
    // tx = await compileAndExecute(0, [
    //     [poolId(3, usdc_eth_pool), [
    //         [vevc, "exactly", parseEther("-0.001")],
    //     ]],
    // ])

    // let vevcBalance = await provider.getBalance(signer.address, "latest", "0x3cD3e41fF4B95a8DdC915F3c7615AB6f2B478c33");
    // console.log('vevcBalance:'+ ethers.utils.formatEther(vevcBalance));
    // console.log("unvote vevc---------------:"+vevcBalance)

    // //console.log(tx)

    // await approvalToken(signer, "0x3cD3e41fF4B95a8DdC915F3c7615AB6f2B478c33", VaultAddress);

    // const vc_vevc_pool = await factory.pools(vevc, vc);
    // // unlock vcvc (vevc must be exchanged to vc firstly,then swap to othter token(eth,usdc))
    // tx = await compileAndExecute(0, [
    //     [poolId(0, vc_vevc_pool), [
    //         [vevc, "exactly", parseEther("0.0005")],
    //         [vc, "at most", parseEther("0.0003")],
    //     ]],
    // ])

    // vevcBalance = await provider.getBalance(signer.address, "latest", "0x3cD3e41fF4B95a8DdC915F3c7615AB6f2B478c33");
    // console.log('vevcBalance:'+ ethers.utils.formatEther(vevcBalance));
    // console.log("unlock vevc---------------:"+vevcBalance);

    // let vcBalance = await provider.getBalance(signer.address, "latest", "0x99bBE51be7cCe6C8b84883148fD3D12aCe5787F2");
    // console.log('vcBalance:'+ ethers.utils.formatEther(vcBalance));
    // console.log("swap vc---------------:"+vcBalance)
    // console.log(tx)

    // swap eth -> dai, exact in
    // let tx = await compileAndExecute(parseEther("0.001"), [
    //     [poolId(0, usdc_eth_pool), [
    //         [eth, "all", INT128_MAX],
    //         [usdc, "at most", parseEther("-99")],
    //     ]],
    //     [poolId(5, weth_eth_pool), [
    //         [eth, "all", INT128_MAX],
    //     ]]
    // ])

  

    //swap usdc -> eth, exact in
    // let tx = await compileAndExecute(0, [
    //     [poolId(0, usdc_eth_pool), [
    //         [usdc, "exactly", parseEther("2")],
    //         [eth, "at most", parseEther("-0.001")],
    //     ]]
    // ])


    /*
    // swap usdc -> eth, exact out
    await compileAndExecute(0, [
        [poolId(0, usdc_eth_pool), [
            [usdc, "at most", parseEther("100")],
            [eth, "exactly", parseEther("-0.001")],
        ]]
    ])

    // swap usdc -> eth -> dai, exact in
    await compileAndExecute(0, [
        [poolId(0, usdc_eth_pool), [
            [usdc, "exactly", parseEther("100")],
            [eth, "at most", INT128_MAX]
        ]],
        [poolId(0, dai_eth_pool), [
            [eth, "all", INT128_MAX],
            [dai, "at most", parseEther("-99")],
        ]]
    ])

    // swap usdc -> eth -> dai, exact out
    await compileAndExecute(0, [
        [poolId(0, dai_eth_pool), [
            [eth, "at most", INT128_MAX],
            [dai, "exactly", parseEther("-99")],
        ]],
        [poolId(0, usdc_eth_pool), [
            [usdc, "at most", parseEther("100")],
            [eth, "all", INT128_MAX]
        ]]
    ])

    // swap eth -> dai, exact in
    await compileAndExecute(parseEther("0.001"), [
        [poolId(0, dai_eth_pool), [
            [eth, "all", INT128_MAX],
            [dai, "at most", parseEther("-99")],
        ]]
    ])

    // swap eth -> dai, exact out, remaining eth will be refunded
    await compileAndExecute(parseEther("0.001"), [
        [poolId(0, dai_eth_pool), [
            [eth, "at most", INT128_MAX],
            [dai, "exactly", parseEther("-99")],
        ]]
    ])   
   
    // unstake and remove liquidity to usdc
    let stakedAmount = (await (await getContractAt("IGauge", usdc_eth_pool)).stakedTokens("0xmy_address"))[0]
    await compileAndExecute(0, [
        [poolId(1, usdc_eth_pool), [ // unstake
            [usdc_eth_lp, "exactly", stakedAmount.neg()],
            [vc, "at most", 0] // vc must be included to receive emissions. it will revert otherwise
        ]],
        [poolId(0, usdc_eth_pool), [ // remove lp
            [usdc, "at most", 0],
            //[eth, "at most", 0],  // uncomment to receive both eth and usdc in proportion
            [usdc_eth_lp, "all", INT128_MAX]
        ]],
    ])
   
*/


}

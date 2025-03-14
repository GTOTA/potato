

import * as zksync from "zksync-web3";
import * as ethers from "ethers";
import { parseEther } from "ethers/lib/utils";


const PRIVATE_KEY = "0x3eb15da85647edd9a1159a4a13b9e7c56877c4eb33f614546d4db06a51868b1c";

const routerAbi = require('../../abis/era-name/era-name.json')
const routerAddress = '0x935442AF47F3dc1c11F006D551E13769F12eab13'

export default async function (hre) {

    const provider = new zksync.Provider(hre.userConfig.networks?.zkSyncTestnet?.url);

    console.log(hre.userConfig.networks?.zkSyncTestnet?.url)
 
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    const eraNameContract = new zksync.Contract(routerAddress, routerAbi, signer);

    let tx = await eraNameContract.primaryAddress(signer.address)

    console.log(tx);

    let era_name = "wk123456.era";

    tx = await eraNameContract.resolveAddress(era_name.replace(".era",""))

    console.log(tx);

    tx = await eraNameContract.primaryAddress(signer.address)

    console.log(tx)

    tx = await eraNameContract.Register(era_name.replace(".era",""),
        {
            value:parseEther("0.003"),
            gasLimit: 5000000, 
            gasPrice: ethers.utils.parseUnits('0.25', 'gwei')
        }
    )

    console.log(tx);

    tx = await eraNameContract.setPrimaryAddress(era_name.replace(".era",""),
        {
            gasLimit: 5000000, 
            gasPrice: ethers.utils.parseUnits('0.25', 'gwei')
        }
    )

    console.log(tx);

    let data_name = "twitter";
    let data_value = "test";

    tx = await eraNameContract.setDataAddress(era_name.replace(".era",""),data_name,data_value,
        {
            gasLimit: 5000000, 
            gasPrice: ethers.utils.parseUnits('0.25', 'gwei')
        }
    )


    tx = await eraNameContract.getDataAddress(era_name.replace(".era",""), data_name);

    console.log(tx);

}
import assert from 'assert'
import { BigNumber} from "ethers";
import { parseEther,formatEther} from "ethers/lib/utils";


const MAX_MINT_FEE = '0.0003'
const MAX_L0_FEE = '0.0005'
const MAX_GAS_FEE = '0.00000000015'

export function checkLoFee(l0_fee) {
    assert(BigNumber.from(l0_fee).lt(parseEther(MAX_L0_FEE)), `l0 fee too high ${formatEther(l0_fee)}`);
}

export function checkMintFee(mint_fee) {
    assert(BigNumber.from(mint_fee).lt(parseEther(MAX_MINT_FEE)), `mint_fee too high ${formatEther(mint_fee)}`);
}

export function checkGasFee(gas_price) {
    assert(BigNumber.from(gas_price).lt(parseEther(MAX_GAS_FEE)), `gas price too high ${formatEther(gas_price)}`);
}

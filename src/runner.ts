import { Syncswap } from './syncswap'
import { Velocore } from './velocore'
import { Spacefi } from './spacefi'
import { Izumi } from './izumi'
import { Mute } from './mute'
import { EraNameServie } from './era'
import { Pancake } from './pancake'
import { ZksNameService } from './zks'





import { SYNCSWAP_ERA_MAIN } from './syncswap/config'
import { VELOCORE_ERA_MAIN } from './velocore/config'
import { SPACEFI_ERA_MAIN } from './spacefi/config'
import { IZUMI_ERA_MAIN } from './izumi/config'
import { MUTE_ERA_MAIN } from './mute/config'
import { PANCAKE_ERA_MAIN } from './pancake/config'
import { ERA_NAME_ERA_MAIN } from './era/config'
import { ZKS_NAME_ERA_MAIN } from './zks/config'



export class syncswap_runner {

    static async swap(from_token: string, to_token: string, token: string, amount_in: string, private_key: string, chain_rpc: string) {
        await new Syncswap(private_key, from_token, to_token,
            SYNCSWAP_ERA_MAIN.router_address, SYNCSWAP_ERA_MAIN.factory_address,
            chain_rpc).swap(from_token, to_token, token, amount_in)
    }

    static async addliquidity(from_token: string, to_token: string, token: string,amount_a: string, amount_b: string, private_key: string, chain_rpc: string) {
        await new Syncswap(private_key, from_token, to_token,
            SYNCSWAP_ERA_MAIN.router_address, SYNCSWAP_ERA_MAIN.factory_address,
            chain_rpc).addLiquidity(from_token, to_token, token, amount_a, amount_b)
    }

    static async burnliquidity(from_token: string, to_token: string, lp_percent:string, private_key: string, chain_rpc: string) {
        await new Syncswap(private_key, from_token, to_token,
            SYNCSWAP_ERA_MAIN.router_address, SYNCSWAP_ERA_MAIN.factory_address,
            chain_rpc).burnLiquidity(from_token, to_token, lp_percent)
    }
}

export class velocore_runner {

    static async swap(from_token: string, to_token: string, token: string, amount_in: string, private_key: string, chain_rpc: string) {
        await new Velocore(private_key, VELOCORE_ERA_MAIN.vault_address, VELOCORE_ERA_MAIN.factory_address,
            chain_rpc).swap(from_token,to_token,token,amount_in)
    }

    static async addliquidity(from_token: string, to_token: string, token: string,amount_a: string, amount_b: string, private_key: string, chain_rpc: string) {
        await new Velocore(private_key,VELOCORE_ERA_MAIN.vault_address, VELOCORE_ERA_MAIN.factory_address,
            chain_rpc).addLiquidity(from_token, to_token,token,amount_a,amount_b)
    }

    static async burnliquidity(from_token: string, to_token: string, token: string,lp_percent:string, private_key: string, chain_rpc: string) {
        await new Velocore(private_key, VELOCORE_ERA_MAIN.vault_address, VELOCORE_ERA_MAIN.factory_address,
            chain_rpc).burnLiquidity(from_token, to_token,token,lp_percent)
    }

    static async vote(from_token: string, to_token: string, token: string,lock_address: string, vote_address: string,lp_percent:string, private_key: string, chain_rpc: string) {
        await new Velocore(private_key, VELOCORE_ERA_MAIN.vault_address, VELOCORE_ERA_MAIN.factory_address,
            chain_rpc).vote(from_token,to_token,token,lock_address,vote_address,lp_percent)
    }
}

export class spacefi_runner {

    static async swap(from_token: string, to_token: string, token: string, amount_in: string, private_key: string, chain_rpc: string) {
        await new Spacefi(private_key, SPACEFI_ERA_MAIN.router_address, SPACEFI_ERA_MAIN.factory_address,
            chain_rpc).swap(from_token,to_token,token,amount_in)
    }

    static async addliquidity(from_token: string, to_token: string, token: string,amount_a: string, amount_b: string, private_key: string, chain_rpc: string) {
        await new Spacefi(private_key,SPACEFI_ERA_MAIN.router_address, SPACEFI_ERA_MAIN.factory_address,
            chain_rpc).addLiquidity(from_token, to_token,token,amount_a,amount_b)
    }

    static async burnliquidity(from_token: string, to_token: string, token: string,lp_percent:string, private_key: string, chain_rpc: string) {
        await new Spacefi(private_key, SPACEFI_ERA_MAIN.router_address, SPACEFI_ERA_MAIN.factory_address,
            chain_rpc).burnLiquidity(from_token, to_token,token,lp_percent)
    }
}

export class izumi_runner {

    static async swap(from_token: string, to_token: string, token: string, amount_in: string, private_key: string, chain_rpc: string) {
        await new Izumi(private_key, IZUMI_ERA_MAIN.router_address, IZUMI_ERA_MAIN.quoter_address,
            chain_rpc).swap(from_token,to_token,token,amount_in)
    }

    static async addliquidity(from_token: string, to_token: string, token: string,amount_a: string, amount_b: string, private_key: string, chain_rpc: string) {
        await new Izumi(private_key,IZUMI_ERA_MAIN.box_address, IZUMI_ERA_MAIN.liquidity_manager_address,
            chain_rpc).addLiquidity(from_token,to_token,token,amount_a,amount_b)
    }

    static async burnliquidity(from_token: string, to_token: string, token: string,lp_percent:string, private_key: string, chain_rpc: string) {
        await new Izumi(private_key, IZUMI_ERA_MAIN.router_address, IZUMI_ERA_MAIN.quoter_address,
            chain_rpc).burnLiquidity(from_token, to_token,token,lp_percent)
    }
}

export class mute_runner {
    static async swap(from_token: string, to_token: string, token: string, amount_in: string, private_key: string, chain_rpc: string) {
        await new Mute(private_key, MUTE_ERA_MAIN.router_address, MUTE_ERA_MAIN.factory,
            chain_rpc).swap(from_token,to_token,token,amount_in)
    }
}

export class pancake_runner {
    static async swap(from_token: string, to_token: string, token: string, amount_in: string, private_key: string, chain_rpc: string) {
        await new Pancake(private_key, PANCAKE_ERA_MAIN.router_address, PANCAKE_ERA_MAIN.factory_address,
            chain_rpc).swap(from_token,to_token,token,amount_in)
    }
}

export class era_name_runner {
    static async regist(era_name: string, private_key: string, chain_rpc: string) {
        await new EraNameServie(private_key, ERA_NAME_ERA_MAIN.router_address,
            chain_rpc).regist(era_name)
    }

    static async resolve(address: string, private_key: string, chain_rpc: string) {
        await new EraNameServie(private_key, ERA_NAME_ERA_MAIN.router_address,
            chain_rpc).resolveAddress(address)
    }

    static async setDataValue(era_name: string, data_name: string, data_value:string, private_key: string, chain_rpc: string) {
        await new EraNameServie(private_key, ERA_NAME_ERA_MAIN.router_address,
            chain_rpc).setDataAddress(era_name,data_name,data_value)
    }

    static async getDataValue(era_name: string, data_name: string, private_key: string, chain_rpc: string) {
        await new EraNameServie(private_key, ERA_NAME_ERA_MAIN.router_address,
            chain_rpc).getDataAddress(era_name,data_name)
    }

    static async setPrimaryAddress(era_name: string, private_key: string, chain_rpc: string) {
        await new EraNameServie(private_key, ERA_NAME_ERA_MAIN.router_address,
            chain_rpc).setPrimaryAddress(era_name)
    }
}

export class zks_name_runner {
    static async regist(era_name: string, private_key: string, chain_rpc: string) {
        await new ZksNameService(private_key,ZKS_NAME_ERA_MAIN.ZKNAME_ADDRESS,
            chain_rpc).regist(era_name)
    }

   
    static async setPrimaryAddress(era_name: string, private_key: string, chain_rpc: string) {
        await new ZksNameService(private_key, ZKS_NAME_ERA_MAIN.BASE_ZKNAME_ADDRESS,
            chain_rpc).setPrimaryDomain(era_name)
    }
}


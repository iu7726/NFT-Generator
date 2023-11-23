import { reactive } from 'vue';
import ERC721ABI from '../../../artifacts/contracts/ERC721Logic.sol/ERC721Logic.json';
import FACTORYABI from '../../../artifacts/contracts/Factory.sol/Factory.json';

export const store = reactive({
    signer: {} as any,
    view: 0,
    erc721ABI: ERC721ABI.abi,
    factoryABI: FACTORYABI.abi,
    address: '' as string,
    balance: '' as string,
    blockTime: '' as any,
})
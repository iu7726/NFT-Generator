import { ethers } from "ethers";
import { store } from "../store/index"

declare var window: any
let provider: any;

export const connect = async () => {
    provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner()

    store.address = await signer.getAddress();
    store.balance = ethers.utils.formatEther(await signer.getBalance());

    return signer;
}

export const factoryAddress = () => "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const getProvider = () => provider;
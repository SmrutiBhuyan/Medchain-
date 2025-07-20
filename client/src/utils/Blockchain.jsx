import { ethers } from "ethers"; // or import ethers from "ethers";

const contractAddress = import.meta.env.VITE_REACT_APP_CONTRACT_ADDRESS;
import contractArtifact from "../abi/MedicineTracking.json";
const contractABI = contractArtifact.abi;

export async function connectWallet() {
    if (!window.ethereum) {
        throw new Error("MetaMask not installed");
    }
    
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    return accounts[0];
}

export async function getContract() {
    if (!window.ethereum) {
        throw new Error("MetaMask not installed");
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
}

export async function verifyDrug(barcode) {
    const contract = await getContract();
    return await contract.verifyDrug(barcode);
}

export async function getDrugDetails(barcode) {
    const contract = await getContract();
    return await contract.drugs(barcode);
}

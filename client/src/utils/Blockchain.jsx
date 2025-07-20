import { ethers } from "ethers";

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
    
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum); // Updated to use BrowserProvider
        const signer = await provider.getSigner();
        return new ethers.Contract(contractAddress, contractABI, signer);
    } catch (error) {
        console.error("Error getting contract:", error);
        throw error;
    }
}

export async function verifyDrug(barcode) {
    try {
        console.log("barcode to be checked is: ",barcode);
        const contract = await getContract();
        const drug = await contract.verifyDrug(barcode);
        return drug;
    } catch (error) {
        console.error("Error verifying drug:", error);
        throw error;
    }
}

export async function getDrugDetails(barcode) {
    try {
        const contract = await getContract();
        const drug = await contract.drugs(barcode);
        return drug;
    } catch (error) {
        console.error("Error getting drug details:", error);
        throw error;
    }
}
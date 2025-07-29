import {ethers} from "ethers";
import dotenv from "dotenv";
import contractArtifact from "../contracts/DrugTrackingABI.json" assert { type: "json" };
dotenv.config();

const contractAddress = process.env.CONTRACT_ADDRESS;
const contractABI = contractArtifact.abi;

const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`);
const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

async function createDrug(drugData) {
    try {
        const tx = await contract.createDrug(
            drugData.name,
            drugData.batch,
            drugData.quantity,
            Math.floor(new Date(drugData.mfgDate).getTime() / 1000), // Convert to Unix timestamp
            Math.floor(new Date(drugData.expiryDate).getTime() / 1000), // Convert to Unix timestamp
            drugData.batchBarcode
        );
        
        const receipt = await tx.wait();
        
        if (receipt.status !== 1) {
            throw new Error('Transaction failed');
        }
        
        return { 
            success: true, 
            txHash: receipt.transactionHash,
            receipt 
        };
    } catch (error) {
        console.error("Blockchain error:", error);
        return { 
            success: false, 
            error: error.message,
            receipt: error.receipt
        };
    }
}

// Add other functions as needed
async function getDrug(barcode) {
    try {
        const drug = await contract.getDrug(barcode);
        return { success: true, drug };
    } catch (error) {
        console.error("Blockchain error:", error);
        return { success: false, error: error.message };
    }
}

async function createBatchOnBlockchain(batchData) {
    try {
        const tx = await contract.createBatch(
            batchData.drugId,
            batchData.quantity
        );
        
        await tx.wait();
        return { success: true, txHash: tx.hash };
    } catch (error) {
        console.error("Blockchain error:", error);
        return { success: false, error: error.message };
    }
}

async function createShipmentOnBlockchain(shipmentData) {
    try {
        const tx = await contract.createShipment(
            shipmentData.batchId,
            shipmentData.quantity,
            shipmentData.distributorAddress,
            shipmentData.destination
        );
        
        await tx.wait();
        return { success: true, txHash: tx.hash };
    } catch (error) {
        console.error("Blockchain error:", error);
        return { success: false, error: error.message };
    }
}

async function verifyShipment(barcode) {
    try {
        const drug = await contract.verifyDrug(barcode);
        return { success: true, drug };
    } catch (error) {
        console.error("Blockchain error:", error);
        return { success: false, error: error.message };
    }
}

async function verifyDrugOnBlockchain(barcode) {
    try {
        const drug = await contract.verifyDrug(barcode);
        return { success: true, drug };
    } catch (error) {
        console.error("Blockchain error:", error);
        return { success: false, error: error.message };
    }
}

export {
    createDrug,
    createBatchOnBlockchain,
    createShipmentOnBlockchain,
    verifyDrugOnBlockchain,
    verifyShipment,
    getDrug
};
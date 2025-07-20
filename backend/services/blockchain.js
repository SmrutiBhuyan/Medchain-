import ethers from "ethers";
import dotenv from "dotenv";
import contractArtifact from "../../blockchain/artifacts/contracts/MedicineTracking.sol/MedicineTracking.json" assert { type: "json" };
dotenv.config();

const contractAddress = process.env.CONTRACT_ADDRESS;
const contractABI = contractArtifact.abi;

const provider = new ethers.providers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`);
const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

async function createDrugOnBlockchain(drugData) {
    try {
        const tx = await contract.createDrug(
            drugData.name,
            drugData.batchNumber,
            Math.floor(new Date(drugData.manufacturingDate).getTime() / 1000),
            Math.floor(new Date(drugData.expiryDate).getTime() / 1000),
            drugData.barcode
        );
        
        await tx.wait();
        return { success: true, txHash: tx.hash };
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
    createDrugOnBlockchain,
    createBatchOnBlockchain,
    createShipmentOnBlockchain,
    verifyDrugOnBlockchain
};
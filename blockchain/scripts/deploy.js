const { ethers } = require("hardhat");

async function main() {
  const MedicineTracking = await ethers.getContractFactory("MedicineTracking");
  const medicineTracking = await MedicineTracking.deploy();
  
  await medicineTracking.deployed();
  console.log("Contract deployed to:", medicineTracking.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
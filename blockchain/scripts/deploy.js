const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const DrugTracking = await hre.ethers.getContractFactory("DrugTracking");
    
    // Deploy with the deployer's address as `initialOwner`
    const drugTracking = await DrugTracking.deploy(deployer.address); 
    
    await drugTracking.waitForDeployment();
    console.log("DrugTracking deployed to:", await drugTracking.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
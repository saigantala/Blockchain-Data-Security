import hre from "hardhat";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const DataVault = await hre.ethers.getContractFactory("DataVault");
    const dataVault = await DataVault.deploy();
    await dataVault.waitForDeployment();
    const dataVaultAddress = await dataVault.getAddress();
    console.log("DataVault deployed to:", dataVaultAddress);

    const SmartWallet = await hre.ethers.getContractFactory("SmartWallet");
    const smartWallet = await SmartWallet.deploy(deployer.address);
    await smartWallet.waitForDeployment();
    const smartWalletAddress = await smartWallet.getAddress();
    console.log("SmartWallet deployed to:", smartWalletAddress);

    // Grant Access to Smart Wallet by default for the demo
    const tx = await dataVault.grantAccess(smartWalletAddress);
    await tx.wait();
    console.log(`Access granted to SmartWallet: ${smartWalletAddress}`);

    // Save addresses for Frontend
    const fs = await import('fs');
    const path = await import('path');
    const addresses = {
        DATA_VAULT: dataVaultAddress,
        SMART_WALLET: smartWalletAddress
    };
    const addressPath = path.join(process.cwd(), "../frontend/src/contract-addresses.json");
    fs.writeFileSync(addressPath, JSON.stringify(addresses, null, 2));
    console.log(`Addresses saved to ${addressPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

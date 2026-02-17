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

    // Initial Anchor: Secure dummy data
    const dummyData = "INITIAL_SYSTEM_DATALINK_ESTABLISHED";
    const dummySymKey = "sym-key-001";
    const ownerDummyKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(deployer.address));

    // Simulate encryption
    const xor = (text, key) => Buffer.from(text).map((c, i) => c ^ key.charCodeAt(i % key.length)).toString('base64');
    const encryptedData = xor(dummyData, dummySymKey);
    const encryptedSymKey = xor(dummySymKey, ownerDummyKey);

    console.log("Anchoring Initial Secure Data...");
    let tx = await dataVault.uploadData(encryptedData, encryptedSymKey);
    await tx.wait();

    // Grant Access to Smart Wallet with its own encrypted key
    const swDummyKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(smartWalletAddress));
    const encryptedKeyForSW = xor(dummySymKey, swDummyKey);

    console.log(`Granting Encrypted Access to SmartWallet: ${smartWalletAddress}`);
    tx = await dataVault.grantAccess(smartWalletAddress, encryptedKeyForSW);
    await tx.wait();

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

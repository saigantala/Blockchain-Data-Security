import hre from "hardhat";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const network = await hre.ethers.provider.getNetwork();

    console.log(`====================================================`);
    console.log(`SUPREME DEPLOYMENT CORE INITIATED`);
    console.log(`Target Network: ${hre.network.name} (ChainID: ${network.chainId})`);
    console.log(`Deployer Account: ${deployer.address}`);
    console.log(`====================================================`);

    const DataVault = await hre.ethers.getContractFactory("DataVault");
    const dataVault = await DataVault.deploy();
    await dataVault.waitForDeployment();
    const dataVaultAddress = await dataVault.getAddress();
    console.log(`[DEPLOY] DataVault established at: ${dataVaultAddress}`);

    const SmartWallet = await hre.ethers.getContractFactory("SmartWallet");
    const smartWallet = await SmartWallet.deploy(deployer.address);
    await smartWallet.waitForDeployment();
    const smartWalletAddress = await smartWallet.getAddress();
    console.log(`[DEPLOY] SmartWallet established at: ${smartWalletAddress}`);

    // Initial Anchor (only for simulation or testing consistency)
    console.log("----------------------------------------------------");
    const dummyData = "SUPREME_VAULT_INITIAL_SNAPSHOT_V1";
    const dummySymKey = "vault-key-init-99";
    const ownerDummyKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(deployer.address));

    const xor = (text, key) => Buffer.from(text).map((c, i) => c ^ key.charCodeAt(i % key.length)).toString('base64');
    const encryptedData = xor(dummyData, dummySymKey);
    const encryptedSymKey = xor(dummySymKey, ownerDummyKey);
    const checksum = hre.ethers.sha256(hre.ethers.toUtf8Bytes(dummyData));

    console.log("[ANCHOR] Securing initial system state...");
    let tx = await dataVault.uploadData(encryptedData, encryptedSymKey, checksum);
    await tx.wait();

    const swDummyKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(smartWalletAddress));
    const encryptedKeyForSW = xor(dummySymKey, swDummyKey);

    console.log(`[RBAC] Authorizing Smart Wallet Controller...`);
    tx = await dataVault.grantAccess(smartWalletAddress, encryptedKeyForSW);
    await tx.wait();
    console.log(`[SUCCESS] Smart Wallet authorization synchronized.`);

    console.log(`====================================================`);
    console.log(`DEPLOYMENT COMPLETE ON ${hre.network.name.toUpperCase()}`);
    console.log(`====================================================`);

    // Save locally for quick reference
    const fs = await import('fs');
    const path = await import('path');
    const addresses = {
        NETWORK: hre.network.name,
        CHAIN_ID: network.chainId.toString(),
        DATA_VAULT: dataVaultAddress,
        SMART_WALLET: smartWalletAddress,
        TIMESTAMP: new Date().toISOString()
    };

    fs.writeFileSync(`./deployment-${hre.network.name}.json`, JSON.stringify(addresses, null, 2));
    console.log(`Metadata exported to: deployment-${hre.network.name}.json`);
}

main().catch((error) => {
    console.error(`[CRITICAL_FAILURE] ${error.message}`);
    process.exitCode = 1;
});

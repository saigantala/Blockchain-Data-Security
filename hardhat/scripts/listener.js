import hre from "hardhat";

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Deployed address
    // For automation, we might want to read from a file or environment variable, 
    // but for this simple demo I'll just ask the user to input it or try to fetch from latest deployment if I implement storage.
    // For now, let's keep it simple as per prompt instructions.

    // Wait, I can't know the address yet. 
    // I will make this script accept an address arg or just hardcode it after deployment. 
    // Let's use an environment variable or command line argument for flexibility.

    let address = process.env.CONTRACT_ADDRESS;

    // Auto-sync: If no env var, try to read from frontend's contract-addresses.json
    if (!address) {
        try {
            const fs = await import('fs');
            const path = await import('path');
            const addressPath = path.join(process.cwd(), "../frontend/src/contract-addresses.json");
            const data = fs.readFileSync(addressPath, 'utf8');
            address = JSON.parse(data).DATA_VAULT;
        } catch (e) {
            console.error("Could not auto-find contract address. Please set CONTRACT_ADDRESS env variable.");
            return;
        }
    }

    const DataVault = await hre.ethers.getContractFactory("DataVault");
    const dataVault = DataVault.attach(address);

    console.log(`Listening for SecurityAlert events on ${address}...`);

    dataVault.on("SecurityAlert", (intruder, time) => {
        console.log("\x1b[31m%s\x1b[0m", `ALARM: WALLET ${intruder} TRIED TO STEAL DATA at timestamp ${time}`);
    });

    dataVault.on("DataUploaded", (hash) => {
        console.log("\x1b[32m%s\x1b[0m", `INFO: NEW SECURE DATA ANCHORED BY OWNER. HASH: ${hash}`);
    });

    // Keep the script running
    await new Promise(() => { });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

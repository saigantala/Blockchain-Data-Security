import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.28",
  networks: {
    // Localhost
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Ethereum Sepolia
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    // Polygon Amoy
    amoy: {
      url: process.env.AMOY_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    // Arbitrum Sepolia
    arbitrumSepolia: {
      url: process.env.ARBITRUM_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
    }
  }
};

System Design Document (SDD)
Project: Blockchain Data Security
Version: 1.0
Date: October 26, 2023

1. Introduction
1.1 Purpose
The purpose of this System Design Document is to provide a comprehensive architectural overview of the Blockchain Data Security system. It details the system architecture, data design, component design, and human-interface design to guide the development team.

1.2 Scope
This document covers the architectural design of the web application, the backend API, the database schema for off-chain storage, and the smart contract structure for on-chain verification.

2. System Architecture
2.1 High-Level Architecture
The system follows a DApp (Decentralized Application) architecture. It utilizes a traditional web frontend and backend for user management and file handling, integrated with a blockchain network for immutable record-keeping.

The architecture consists of three main layers:

Presentation Layer: The user interface (Web Client).

Application Layer: The backend server handling business logic, encryption, and hashing.

Data Layer:

Off-chain: Database/IPFS for storing the actual encrypted files and user data.

On-chain: Blockchain ledger for storing the hashes (proof of existence).

2.2 Technology Stack
Frontend: React.js (or Next.js) for the user interface.

Backend: Node.js with Express.js (or Python Flask).

Blockchain: Ethereum (Sepolia Testnet) or Polygon.

Smart Contracts: Solidity.

Storage: IPFS (for decentralized file storage) or AWS S3 (for centralized secure storage).

Database: MongoDB (for user metadata).

Library: Web3.js or Ethers.js (for blockchain interaction).

3. Component Design
3.1 Frontend Component
Auth Module: Handles user login/signup and wallet connection (MetaMask).

Upload Manager: Accepts files, reads binary data, and sends it to the backend.

Dashboard: Fetches the list of user files and their verification status from the backend/blockchain.

3.2 Backend Component
Encryption Service: Uses AES-256 to encrypt files upon receipt.

Hashing Service: Generates SHA-256 hashes of the original files.

IPFS Handler: Pushes the encrypted file to IPFS and retrieves the Content Identifier (CID).

Smart Contract Controller: Listens for events and manages write operations to the blockchain (if using a gas-station relayer).

3.3 Blockchain Component (Smart Contract)
Contract Name: DataVerifier

Functions:

uploadHash(string memory _hash, string memory _metaData): Stores the file hash mapped to the owner.

verifyHash(string memory _hash): Returns a boolean indicating if the hash exists.

4. Data Design
4.1 Off-Chain Database (MongoDB)
This database stores user profiles and references to files to speed up the UI.

Collection: Users
| Field | Type | Description |
| :--- | :--- | :--- |
| _id | ObjectId | Unique User ID |
| username | String | User's display name |
| walletAddress | String | Ethereum wallet address |
| email | String | (Optional) Contact email |

Collection: Files
| Field | Type | Description |
| :--- | :--- | :--- |
| _id | ObjectId | Unique File ID |
| owner_id | ObjectId | Reference to User |
| fileName | String | Original name of the file |
| ipfs_cid | String | Location of the encrypted file |
| fileHash | String | SHA-256 Hash (The key for verification) |
| txHash | String | Blockchain Transaction ID |
| timestamp | Date | Upload time |

4.2 On-Chain Data Structure (Solidity)
The smart contract uses a struct to store essential proofs.

Solidity
struct FileRecord {
    string fileHash;    // Unique identifier
    string ipfsCid;     // Location of encrypted data
    uint256 timestamp;  // Block timestamp
    address owner;      // Who uploaded it
}

mapping(string => FileRecord) public files; // Maps Hash -> Record
5. Data Flow
5.1 Upload Process
User selects a file on the Frontend.

Frontend sends the file to the Backend.

Backend calculates SHA-256 Hash of the file.

Backend encrypts the file using AES.

Backend uploads the Encrypted File to IPFS and gets the CID.

User/Backend triggers a MetaMask transaction to call uploadHash(Hash, CID) on the Smart Contract.

Blockchain records the transaction and returns a Transaction Hash.

Backend saves the metadata (Hash, CID, TxHash) in MongoDB.

5.2 Verification Process
User selects a file to verify.

System calculates the hash of the current file.

System queries the Smart Contract using the calculated hash.

Smart Contract returns the stored record (if it exists).

Frontend compares the returned record with the current file details.

Match: "File is Authentic."

Mismatch/No Result: "File has been tampered with or does not exist."

6. Interface Design (API)
6.1 API Endpoints
POST /api/auth/login: Authenticate user.

POST /api/files/upload: Upload a new file (Multipart/form-data).

GET /api/files/my-files: specific user's file history.

POST /api/files/verify: Send a file to check its integrity against the DB/Blockchain.

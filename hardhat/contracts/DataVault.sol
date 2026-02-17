// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DataVault is Ownable, ReentrancyGuard {
    error NotAuthorized();

    mapping(address => bool) public authorizedUsers;
    mapping(address => string) public userKeys; // Encrypted symmetric keys for users
    string private secretDataHash; // Encrypted IPFS hash
    string private dataChecksum; // SHA-256 of original data

    event SecurityAlert(address indexed intruder, uint256 time);
    event DataUploaded(string encryptedHash);

    constructor() Ownable(msg.sender) {
        authorizedUsers[msg.sender] = true;
    }

    function uploadData(
        string calldata _encryptedHash,
        string calldata _ownerKey,
        string calldata _checksum
    ) external onlyOwner {
        secretDataHash = _encryptedHash;
        userKeys[msg.sender] = _ownerKey;
        dataChecksum = _checksum;
        emit DataUploaded(_encryptedHash);
    }

    function grantAccess(address user, string calldata encryptedKey) external onlyOwner {
        authorizedUsers[user] = true;
        userKeys[user] = encryptedKey;
    }

    function revokeAccess(address user) external onlyOwner {
        authorizedUsers[user] = false;
        delete userKeys[user]; // Clear the key for security
    }

    function accessData() external nonReentrant returns (string memory encryptedHash, string memory key, string memory checksum) {
        if (!authorizedUsers[msg.sender]) {
            emit SecurityAlert(msg.sender, block.timestamp);
            revert NotAuthorized();
        }
        return (secretDataHash, userKeys[msg.sender], dataChecksum);
    }
}

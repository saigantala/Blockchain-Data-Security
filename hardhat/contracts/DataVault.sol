// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DataVault {
    mapping(address => bool) public authorizedUsers;
    address public owner;
    string private secretDataHash; // Encrypted IPFS hash
    string private dataChecksum; // SHA-256 of original data

    event SecurityAlert(address indexed intruder, uint256 time);
    event DataUploaded(string encryptedHash);

    constructor() {
        owner = msg.sender;
        authorizedUsers[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    function uploadData(string calldata _encryptedHash, string calldata _ownerKey, string calldata _checksum) external onlyOwner {
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

    function accessData() external returns (string memory encryptedHash, string memory key, string memory checksum) {
        if (!authorizedUsers[msg.sender]) {
            emit SecurityAlert(msg.sender, block.timestamp);
            return ("ACCESS DENIED", "", "");
        }
        return (secretDataHash, userKeys[msg.sender], dataChecksum);
    }
}

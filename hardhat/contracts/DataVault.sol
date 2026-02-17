// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DataVault {
    mapping(address => bool) public authorizedUsers;
    mapping(address => string) public userKeys; // Encrypted symmetric keys for users
    address public owner;
    string private secretDataHash; // Encrypted IPFS hash

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

    function uploadData(string calldata _encryptedHash, string calldata _ownerKey) external onlyOwner {
        secretDataHash = _encryptedHash;
        userKeys[msg.sender] = _ownerKey;
        emit DataUploaded(_encryptedHash);
    }

    function grantAccess(address user, string calldata encryptedKey) external onlyOwner {
        authorizedUsers[user] = true;
        userKeys[user] = encryptedKey;
    }

    function accessData() external returns (string memory encryptedHash, string memory key) {
        if (!authorizedUsers[msg.sender]) {
            emit SecurityAlert(msg.sender, block.timestamp);
            return ("ACCESS DENIED", "");
        }
        return (secretDataHash, userKeys[msg.sender]);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DataVault {
    mapping(address => bool) public authorizedUsers;
    address public owner;

    event SecurityAlert(address indexed intruder, uint256 time);

    constructor() {
        owner = msg.sender;
        authorizedUsers[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    function grantAccess(address user) external onlyOwner {
        authorizedUsers[user] = true;
    }

    function accessData() external returns (string memory) {
        if (!authorizedUsers[msg.sender]) {
            emit SecurityAlert(msg.sender, block.timestamp);
            return "ACCESS DENIED: SECURITY ALERT TRIGGERED";
        }
        return "IPFS_HASH_QmXyZ7...";
    }
}

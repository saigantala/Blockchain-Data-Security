// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SmartWallet {
    address public owner;

    event Execution(address indexed target, bytes data, uint256 value);

    constructor(address _owner) {
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function execute(address _target, bytes calldata _data) external payable onlyOwner {
        (bool success, ) = _target.call{value: msg.value}(_data);
        require(success, "Execution failed");
        emit Execution(_target, _data, msg.value);
    }

    receive() external payable {}
}

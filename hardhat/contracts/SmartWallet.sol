// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SmartWallet is Ownable {
    error ExecutionFailed();

    event Execution(address indexed target, bytes data, uint256 value);

    constructor(address _owner) Ownable(_owner) {}

    function execute(address _target, bytes calldata _data) external payable onlyOwner {
        (bool success, ) = _target.call{value: msg.value}(_data);
        if (!success) revert ExecutionFailed();
        emit Execution(_target, _data, msg.value);
    }

    receive() external payable {}
}

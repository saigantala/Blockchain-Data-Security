export const DATA_VAULT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
export const SMART_WALLET_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

export const DATA_VAULT_ABI = [
    "error NotAuthorized()",
    "function uploadData(string calldata _encryptedHash, string calldata _ownerKey, string calldata _checksum) external",
    "function grantAccess(address user, string calldata encryptedKey) external",
    "function revokeAccess(address user) external",
    "function accessData() external returns (string memory encryptedHash, string memory key, string memory checksum)",
    "function owner() external view returns (address)",
    "function authorizedUsers(address) external view returns (bool)",
    "function userKeys(address) external view returns (string)",
    "event SecurityAlert(address indexed intruder, uint256 time)",
    "event DataUploaded(string encryptedHash)"
] as const;

export const SMART_WALLET_ABI = [
    "error ExecutionFailed()",
    "function execute(address target, bytes data) external payable",
    "function owner() external view returns (address)",
    "event Execution(address indexed target, bytes data, uint256 value)"
] as const;

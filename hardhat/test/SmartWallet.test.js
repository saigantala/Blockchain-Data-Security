import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("SmartWallet", function () {
    let smartWallet;
    let owner;
    let otherAccount;

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();
        const SmartWallet = await ethers.getContractFactory("SmartWallet");
        smartWallet = await (await SmartWallet.deploy(owner.address)).waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await smartWallet.owner()).to.equal(owner.address);
        });
    });

    describe("Execution", function () {
        it("Should allow owner to execute calls", async function () {
            // Test with a simple transfer
            const tx = await smartWallet.execute(otherAccount.address, "0x", { value: ethers.parseEther("1.0") });
            await expect(tx).to.emit(smartWallet, "Execution").withArgs(otherAccount.address, "0x", ethers.parseEther("1.0"));
        });

        it("Should fail if a non-owner tries to execute", async function () {
            await expect(
                smartWallet.connect(otherAccount).execute(owner.address, "0x")
            ).to.be.revertedWithCustomError(smartWallet, "OwnableUnauthorizedAccount");
        });

        it("Should fail if the call reverts", async function () {
            const DataVault = await ethers.getContractFactory("DataVault");
            const dataVault = await (await DataVault.deploy()).waitForDeployment();

            // DataVault.accessData() reverts for unauthorized. 
            const data = dataVault.interface.encodeFunctionData("accessData");

            await expect(smartWallet.execute(await dataVault.getAddress(), data))
                .to.be.revertedWithCustomError(smartWallet, "ExecutionFailed");
        });
    });
});

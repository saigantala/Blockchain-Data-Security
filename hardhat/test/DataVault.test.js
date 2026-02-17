import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("DataVault", function () {
    let dataVault;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const DataVault = await ethers.getContractFactory("DataVault");
        dataVault = await (await DataVault.deploy()).waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await dataVault.owner()).to.equal(owner.address);
        });

        it("Should authorize the owner by default", async function () {
            expect(await dataVault.authorizedUsers(owner.address)).to.equal(true);
        });
    });

    describe("Access Management", function () {
        it("Should allow owner to grant access", async function () {
            await dataVault.grantAccess(addr1.address, "encrypted-key-for-addr1");
            expect(await dataVault.authorizedUsers(addr1.address)).to.equal(true);
            expect(await dataVault.userKeys(addr1.address)).to.equal("encrypted-key-for-addr1");
        });

        it("Should allow owner to revoke access", async function () {
            await dataVault.grantAccess(addr1.address, "key");
            await dataVault.revokeAccess(addr1.address);
            expect(await dataVault.authorizedUsers(addr1.address)).to.equal(false);
            expect(await dataVault.userKeys(addr1.address)).to.equal("");
        });

        it("Should fail if a non-owner tries to grant access", async function () {
            await expect(
                dataVault.connect(addr1).grantAccess(addr2.address, "key")
            ).to.be.revertedWithCustomError(dataVault, "OwnableUnauthorizedAccount");
        });
    });

    describe("Data Storage", function () {
        it("Should allow owner to upload data", async function () {
            const hash = "ipfs-hash";
            const key = "owner-key";
            const checksum = "checksum-sha256";

            await expect(dataVault.uploadData(hash, key, checksum))
                .to.emit(dataVault, "DataUploaded")
                .withArgs(hash);
        });

        it("Should allow authorized users to access data", async function () {
            const hash = "ipfs-hash";
            const key = "key";
            const checksum = "checksum";

            await dataVault.uploadData(hash, key, checksum);

            const result = await dataVault.accessData.staticCall();
            expect(result.encryptedHash).to.equal(hash);
            expect(result.key).to.equal(key);
            expect(result.checksum).to.equal(checksum);
        });

        it("Should revert if unauthorized access", async function () {
            await expect(dataVault.connect(addr1).accessData())
                .to.be.revertedWithCustomError(dataVault, "NotAuthorized");
        });
    });
});

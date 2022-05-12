const { expect } = require("chai");

describe("Cryptos contract", function () {
  let Cryptos;
  let hardhatCryptos;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Cryptos = await ethers.getContractFactory("Cryptos");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    hardhatCryptos = await Cryptos.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await hardhatCryptos.founder()).to.equal(owner.address);
    });

    it("Should assign the total supply of cryptos to the owner", async function () {
      const ownerBalance = await hardhatCryptos.balanceOf(owner.address);
      expect(await hardhatCryptos.totalSupply()).to.equal(ownerBalance);
      expect(await hardhatCryptos.name()).to.equal("Cryptos");
      expect(await hardhatCryptos.symbol()).to.equal("CRPT");
      expect(await hardhatCryptos.decimals()).to.equal(0);
    });
  });

  describe("Transactions", function () {
    it("Should transfer cryptos between accounts", async function () {
      // Transfer 50 cryptos from owner to addr1
      await hardhatCryptos.transfer(addr1.address, 150);
      let addr1Balance = await hardhatCryptos.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(150);

      // Transfer 50 cryptos from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await hardhatCryptos.connect(addr1).transfer(addr2.address, 40);
      const addr2Balance = await hardhatCryptos.balanceOf(addr2.address);
      addr1Balance = await hardhatCryptos.balanceOf(addr1.address);
      expect(addr2Balance).to.equal(40);
      expect(addr1Balance).to.equal(110);
    });

    it("Should fail if sender doesn’t have enough cryptos", async function () {
      const initialOwnerBalance = await hardhatCryptos.balanceOf(owner.address);

      // Try to send 1 Cryptos from addr1 (0 cryptos) to owner (1000000 cryptos).
      // `require` will evaluate false and revert the transaction.
      await expect(
        hardhatCryptos.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Not enough cryptos");

      // Owner balance shouldn't have changed.
      expect(await hardhatCryptos.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await hardhatCryptos.balanceOf(owner.address);

      // Transfer 100 cryptos from owner to addr1.
      await hardhatCryptos.transfer(addr1.address, 100);

      // Transfer another 50 cryptos from owner to addr2.
      await hardhatCryptos.transfer(addr2.address, 50);

      // Check balances.
      const finalOwnerBalance = await hardhatCryptos.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150);

      const addr1Balance = await hardhatCryptos.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await hardhatCryptos.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });
  });

  describe("Allowance Transactions", function () {
    it("Should approve cryptos between accounts", async function () {
      // Approve 150 cryptos from owner to addr1
      await hardhatCryptos.approve(addr1.address, 150);
      let addr1Allowance = await hardhatCryptos.allowance(
        owner.address,
        addr1.address
      );
      expect(addr1Allowance).to.equal(150);
    });
    it("Should reject allowance when no balance", async function () {
      await expect(
        hardhatCryptos.connect(addr1).approve(addr2.address, 100)
      ).to.be.revertedWith("Not enough cryptos");
    });
  });

  describe("Transfer From allowance Transactions", function () {
    let addr1Allowance;
    let initialOwnerBalance;
    beforeEach(async function () {
      // Approve 150 cryptos from owner to addr1
      await hardhatCryptos.approve(addr1.address, 150);
      addr1Allowance = await hardhatCryptos.allowance(
        owner.address,
        addr1.address
      );
    });
    it("Should approve cryptos between accounts", async function () {
      initialOwnerBalance = await hardhatCryptos.balanceOf(owner.address);
      expect(addr1Allowance).to.equal(150);
      expect(initialOwnerBalance).to.equal(await hardhatCryptos.totalSupply());
    });
    it("Should reject allowance when no balance", async function () {
      await expect(
        hardhatCryptos.connect(addr1).approve(addr2.address, 200)
      ).to.be.revertedWith("Not enough cryptos");
    });
    it("Should transferFrom owner to addr1 based on allowance", async function () {
      expect(addr1Allowance).to.equal(150);
      await hardhatCryptos.transferFrom(owner.address, addr1.address, 50);
      const finalOwnerBalance = await hardhatCryptos.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(50));

      addr1Allowance = await hardhatCryptos.allowance(
        owner.address,
        addr1.address
      );
      expect(addr1Allowance).to.equal(100);
      const addr1Balance = await hardhatCryptos.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);
    });
    it("Should transferFrom addr1 to addr2 based on allowance", async function () {
      await hardhatCryptos.transferFrom(owner.address, addr1.address, 100);
      let addr1Balance = await hardhatCryptos.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);
      await hardhatCryptos.connect(addr1).approve(addr2.address, 50);
      await hardhatCryptos.transferFrom(addr1.address, addr2.address, 25);
      addr1Balance = await hardhatCryptos.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(75);
      const addr2Balance = await hardhatCryptos.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(25);
      let addr2Allowance = await hardhatCryptos.allowance(
        addr1.address,
        addr2.address
      );
      expect(addr2Allowance).to.equal(25);
    });
  });
});

const { expect } = require("chai");

function convertBalanceDiff(intialBalance, finalBalance) {
  let balance = finalBalance.sub(intialBalance);
  let bal = ethers.utils.formatEther(balance);
  bal = (+bal).toFixed(5);
  bal = parseFloat(bal);
  return bal;
}

describe("Lottery contract", function () {
  let Lottery;
  let hardhatLottery;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;
  let contractAddr;
  let ticketPrice = "2.5";

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Lottery = await ethers.getContractFactory("Lottery");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    hardhatLottery = await Lottery.deploy(ethers.utils.parseEther("2.5"));
    contractAddr = await hardhatLottery.address;
  });

  describe("Lottery Deployment======", function () {
    it("Should set the right owner", async function () {
      expect(await hardhatLottery.manager()).to.equal(owner.address);
    });
  });
  describe("Lottery enrollment and picking winner", function () {
    beforeEach(async function () {
      // Sends exactly 0.1 ether to the contract.
      await addr1.sendTransaction({
        to: contractAddr,
        value: ethers.utils.parseEther(ticketPrice),
      });
      await addr2.sendTransaction({
        to: contractAddr,
        value: ethers.utils.parseEther(ticketPrice),
      });
    });

    it("Enlist addr1 and addr2 as players in Lottery", async function () {
      expect(await hardhatLottery.players(0)).to.equal(addr1.address);
      expect(await hardhatLottery.players(1)).to.equal(addr2.address);
      let contractBalance = await hardhatLottery.getContractBalance();
      expect(contractBalance).to.equal(ethers.utils.parseEther("5.0"));
    });

    it("Only Manager can pick a winner", async function () {
      await expect(
        hardhatLottery.connect(addr1).pickWinner()
      ).to.be.revertedWith("Only the manager can pick a winner");
    });

    it("Must have minimum 3 players for picking a winner", async function () {
      await expect(hardhatLottery.pickWinner()).to.be.revertedWith(
        "There must be at least 3 players to pick a winner"
      );
    });

    it("Pick Winner from players, check balances after winning of Owner and Winner", async function () {
      await addr3.sendTransaction({
        to: contractAddr,
        value: ethers.utils.parseEther(ticketPrice),
      });

      const playerInitialBals = [
        await hardhatLottery.balanceOf(addr1.address),
        await hardhatLottery.balanceOf(addr2.address),
        await hardhatLottery.balanceOf(addr3.address),
      ];

      const ownerIntialBalance = await hardhatLottery.balanceOf(owner.address);
      await hardhatLottery.pickWinner();

      const playersArray = [addr1.address, addr2.address, addr3.address];

      // Check if the contract balance is 0
      const contractBalance = await hardhatLottery.getContractBalance();
      expect(contractBalance).to.equal(ethers.utils.parseEther("0"));

      // check if the owner balance is increased by the 10% of winning amount
      const ownerFinalBalance = await hardhatLottery.balanceOf(owner.address);
      const ownerBalDiff = convertBalanceDiff(
        ownerIntialBalance,
        ownerFinalBalance
      );
      const tenPercentReward = (7.5 * 10) / 100; // Owner gets 10% of winning amount
      expect(ownerBalDiff).to.be.closeTo(tenPercentReward, 0.001);

      // Check if the winner balance is increased by the 90% of winning amount
      const winnerIndex = await hardhatLottery.winnerIndex();
      const winnerAddress = playersArray[winnerIndex];
      const ninetyPercentReward = (7.5 * 90) / 100; // Winner gets 90% of winning amount
      const winnerInitialBal = playerInitialBals[winnerIndex];
      const winnerFinalBal = await hardhatLottery.balanceOf(winnerAddress);
      const winnerBalDiff = convertBalanceDiff(
        winnerInitialBal,
        winnerFinalBal
      );
      expect(winnerBalDiff).to.be.closeTo(ninetyPercentReward, 0.001);
    });
  });
});

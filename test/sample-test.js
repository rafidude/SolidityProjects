const { expect } = require("chai");
const { ethers } = require("hardhat");

/*
  beforeEach(async function () {
    await db.clear();
    await db.save([tobi, loki, jane]);
  });

  describe('#find()', function () {
    it('responds with matching records', async function () {
      const users = await db.find({type: 'User'});
      users.should.have.length(3);
    });
  });
*/

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    // const accounts = await ethers.getSigners();
    // for (const idx in accounts) {
    //   console.log(accounts[idx].address);
    // }
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});

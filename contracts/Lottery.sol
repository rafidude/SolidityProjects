//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <0.9.0;
import "hardhat/console.sol";

contract Lottery {
    // declaring the state variables
    address payable[] public players; //dynamic array of type address payable
    address payable public manager;
    uint256 public winnerIndex;
    uint256 public ticketPrice;

    // declaring the constructor
    constructor(uint256 _ticketPrice) {
        // the amount players need to send to enter the Lottery
        ticketPrice = _ticketPrice;
        // initializing the owner to the address that deploys the contract
        manager = payable(msg.sender);
    }

    // declaring the receive() function that is necessary to receive ETH
    receive() external payable {
        // Manager cannot participate in the Lottery
        require(msg.sender != manager);
        // each player sends exactly ticketPrice ETH
        require(msg.value == ticketPrice);
        // appending the player to the players array
        players.push(payable(msg.sender));
    }

    // returning the contract's balance in wei
    function getContractBalance() public view returns (uint256) {
        // only the manager is allowed to call it
        require(msg.sender == manager);
        return address(this).balance;
    }

    // helper function that returns a big random integer
    function random() internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.difficulty,
                        block.timestamp,
                        players.length
                    )
                )
            );
    }

    function balanceOf(address anyAddress)
        public
        view
        returns (uint256 balance)
    {
        return anyAddress.balance;
    }

    // selecting the winner
    function pickWinner() public {
        // only the manager can pick a winner if there are at least 3 players in the lottery
        require(msg.sender == manager, "Only the manager can pick a winner");
        require(
            players.length >= 3,
            "There must be at least 3 players to pick a winner"
        );

        uint256 r = random();

        // computing a random index of the array
        uint256 index = r % players.length;
        address payable winner = players[index];
        winnerIndex = index;
        uint256 totalAmount = getContractBalance();
        uint256 toManager = (totalAmount * 1) / 10;
        uint256 toWinner = (totalAmount * 9) / 10;
        // transferring the entire contract's balance to the winner
        manager.transfer(toManager);
        winner.transfer(toWinner);

        // resetting the lottery for the next round
        players = new address payable[](0);
    }
}

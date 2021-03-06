//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <0.9.0;
import "hardhat/console.sol";

// ----------------------------------------------------------------------------
// EIP-20: ERC-20 Token Standard
// https://eips.ethereum.org/EIPS/eip-20
// -----------------------------------------

interface ERC20Interface {
    function totalSupply() external view returns (uint256);

    function balanceOf(address tokenOwner)
        external
        view
        returns (uint256 balance);

    function transfer(address to, uint256 tokens)
        external
        returns (bool success);

    function allowance(address tokenOwner, address spender)
        external
        view
        returns (uint256 remaining);

    function approve(address spender, uint256 tokens)
        external
        returns (bool success);

    function transferFrom(
        address from,
        address to,
        uint256 tokens
    ) external returns (bool success);

    event Transfer(address indexed from, address indexed to, uint256 tokens);
    event Approval(
        address indexed tokenOwner,
        address indexed spender,
        uint256 tokens
    );
}

contract Cryptos is ERC20Interface {
    string public name = "Cryptos";
    string public symbol = "CRPT";
    uint256 public decimals = 0; //18 is very common
    uint256 public override totalSupply;

    address public founder;
    mapping(address => uint256) public balances;
    // balances[0x1111...] = 100;

    // similar to credit limit
    mapping(address => mapping(address => uint256)) allowed;

    // allowed[0x111][0x222] = 100;

    constructor() {
        totalSupply = 1000000;
        founder = msg.sender;
        balances[founder] = totalSupply;
    }

    function balanceOf(address tokenOwner)
        public
        view
        override
        returns (uint256 balance)
    {
        return balances[tokenOwner];
    }

    function transfer(address to, uint256 tokens)
        public
        override
        returns (bool success)
    {
        require(balances[msg.sender] >= tokens, "Not enough cryptos");

        balances[to] += tokens;
        balances[msg.sender] -= tokens;
        emit Transfer(msg.sender, to, tokens);

        return true;
    }

    function allowance(address tokenOwner, address spender)
        public
        view
        override
        returns (uint256)
    {
        return allowed[tokenOwner][spender];
    }

    function approve(address spender, uint256 tokens)
        public
        override
        returns (bool success)
    {
        require(balances[msg.sender] >= tokens, "Not enough cryptos");
        require(tokens > 0, "Number of cryptos cannot be negative");

        allowed[msg.sender][spender] = tokens;

        emit Approval(msg.sender, spender, tokens);
        return true;
    }

    // Issue tokens to a spender from allowed limit
    function transferFrom(
        address from,
        address to,
        uint256 tokens
    ) public override returns (bool success) {
        require(
            allowed[from][to] >= tokens,
            "Tokens cannot be greater than allowance"
        );
        require(balances[from] >= tokens, "Not enough balance in from address");

        balances[from] -= tokens;
        allowed[from][to] -= tokens;
        balances[to] += tokens;

        emit Transfer(from, to, tokens);

        return true;
    }
}

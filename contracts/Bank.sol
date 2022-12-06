// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Bank {
    address public owner;
    bytes32[] public whitelistedSymbols;
    mapping(bytes32 => address) public whitelistedTokens;
    mapping(address => mapping(bytes32 => uint256)) public balances;

    constructor() {
        owner = msg.sender;
    }

    //Fn to add tokens to the smart contract
    function whitelistTokens(bytes32 _symbol, address _tokenAddress) external {
        require(msg.sender == owner, "Only owner can call this function!");
        whitelistedSymbols.push(_symbol); //push the symbol token to the array
        whitelistedTokens[_symbol] = _tokenAddress; //map the symbol token to its token address
    }

    //Fn to return the array of symbols
    function getWhiteSymbols() external view returns (bytes32[] memory) {
        return whitelistedSymbols;
    }

    //Fn to get the address of a specific symbol
    function getWhiteTokenAddress(
        bytes32 _symbol
    ) external view returns (address) {
        return whitelistedTokens[_symbol]; //(i.e: whiteListedTokens["ETH"] returns--> 0x71C7656EC7ab88b098defB751B7401B5f6d8976F)
    }

    //Fn to receive ethereum, map the msg.sender with ETH symbol and increment the msg.value
    receive() external payable {
        balances[msg.sender]["ETH"] += msg.value;
    }

    //Fn to withdraw the ETH
    function withdrawEther(uint256 _amount) external {
        require(balances[msg.sender]["ETH"] >= _amount, "Insuficient funds"); //check if the msg.sender has that balance
        balances[msg.sender]["ETH"] -= _amount; //reduce the balance
        payable(msg.sender).call{value: _amount}("");
    }

    //Fn to deposit specific token
    function depositToken(uint256 _amount, bytes32 _symbol) external {
        balances[msg.sender][_symbol] += _amount; //increase balance to the msg.sender
        IERC20(whitelistedTokens[_symbol]).transferFrom(
            msg.sender,
            address(this),
            _amount
        ); //request transfer from msg.sender to this(contract) address
    }

    //Fn to withdraw specific token
    function withdrawToken(uint256 _amount, bytes32 _symbol) external {
        require(balances[msg.sender][_symbol] >= _amount, "Insuficient funds"); //check if enough balance
        balances[msg.sender][_symbol] -= _amount; //reduce balance in our smartcontract
        IERC20(whitelistedTokens[_symbol]).transfer(msg.sender, _amount); //send the amount of tokens to the msg.sender
    }

    //Fn to getBalance of specific token
    function getTokenBalance(bytes32 _symbol) external view returns (uint256) {
        return balances[msg.sender][_symbol];
    }
}

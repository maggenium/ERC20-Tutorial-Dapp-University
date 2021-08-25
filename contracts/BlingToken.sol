// SPDX-License-Identifier: ISC
pragma solidity ^0.8.7;

contract BlingToken {
    string public name = "Bling Token";
    string public symbol = "BLNG";
    string public standard = "Bling Token v1.0";
    uint256 public totalSupply;

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    mapping(address => uint256) public balanceOf;

    constructor (uint256 _initialSupply) public {
        balanceOf[msg.sender] = _initialSupply;
        totalSupply = _initialSupply;
    }

    // Transfer
    function transfer(address _to, uint256 _value) public returns (bool success) {
        // Exception if account doesn't have enough
        require(balanceOf[msg.sender] >= _value);
        // Transfer the balance
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        // Emit Transfer Event
        emit Transfer(msg.sender, _to, _value);
        // Return a boolean
        return true;
    }
}
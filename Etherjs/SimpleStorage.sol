// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// EVM compatible blockchains are Avalanche, fantom, polygon
contract SimpleStorage {
    // boolean, unit, int, address, bytes
    // uint unsigned integer
    // bool hasFavouriteNumber = true;

    // we use unit to specify how many bit the number can use
    // uint256 favouriteNumber = 123;
    // string favNumInText = "five";
    // int256 favInt = -3;
    // address myAddress = 0xD57577BC6cdcF9a7EC9e7536BacB2C6c154CF521;
    // bytes32 favByte = "cat";

    // default visibility is internal;

    // mapping:
    mapping(string => uint256) public nameToFavNumber;

    // struct:

    struct People {
        uint256 favNum;
        string name;
    }
    // People public person = People({favNum:2, name:"kattar"});

    // Array:
    // uint256[] public favNumList;

    // array of struct
    People[] public people;

    function addPerson(string memory _name, uint256 _favNum) public {
        people.push(People(_favNum, _name));
        nameToFavNumber[_name] = _favNum;
    }

    uint public favNumber;

    function store(uint256 _favNum) public virtual {
        favNumber = _favNum;
    }

    // mapping is the data structure where a key is "mapped" to a single value

    // 0xd9145CCE52D386f254917e481eB44e9943F39138    -->this is the contract that we deployed on the blockchain

    function retrieve() public view returns (uint256) {
        return favNumber;
    }

    // function add() public pure returns(uint256){
    //     return (1+1);
    // }
}

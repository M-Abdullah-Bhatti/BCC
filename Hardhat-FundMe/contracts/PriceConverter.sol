// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    // This function tells etherium price in USD
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        // As we are interacting outside our project
        // ABI
        // Address 	0x8A753747A1Fa494EC906cE90E9f37563A8AF630e  -->get it from ethereum data feed

        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     //    Goerli-->  0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        //     0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        // );

        (, int256 answer, , , ) = priceFeed.latestRoundData();
        // price of ETH in term of USD
        // 3000.00000000
        return uint256(answer * 1e10); // 1*10 **10
        // this will give 300000000000
    }

    // function getVersion() internal view returns (uint256) {
    //     AggregatorV3Interface priceFeed = AggregatorV3Interface(
    //         0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
    //     );
    //     return priceFeed.version();
    // }

    // this function will convert msg.value(some eth value) amount in USD
    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        // 3000_000000000000000000
        // 1_000000000000000000

        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        // 2999e21
        return ethAmountInUsd;
    }
}

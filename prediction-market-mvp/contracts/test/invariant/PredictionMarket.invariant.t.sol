// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";
import "../../contracts/MockUSDC.sol";
import "../../contracts/PredictionMarketFactory.sol";
import "../../contracts/PredictionMarket.sol";
import "./MarketHandler.sol";

contract PredictionMarketInvariant is StdInvariant, Test {
    MockUSDC internal usdc;
    PredictionMarketFactory internal factory;
    PredictionMarket internal market;
    MarketHandler internal handler;

    address internal admin = address(0xA11CE);
    address internal creator = address(0xB0B);
    address internal oracle = address(0xC0FFEE);

    function setUp() external {
        usdc = new MockUSDC();

        vm.prank(admin);
        factory = new PredictionMarketFactory(admin, creator, oracle, address(usdc));

        vm.prank(creator);
        (uint256 marketId,) = factory.createMarket(block.timestamp + 7 days);
        market = PredictionMarket(factory.markets(marketId));

        address[] memory users = new address[](3);
        users[0] = address(0xAA01);
        users[1] = address(0xBB01);
        users[2] = address(0xCC01);

        handler = new MarketHandler(usdc, market, users);
        targetContract(address(handler));
    }

    function invariant_balanceMatchesPools() external view {
        uint256 contractBalance = usdc.balanceOf(address(market));
        uint256 poolSum = market.yesPool() + market.noPool();
        assertEq(contractBalance, poolSum);
    }
}

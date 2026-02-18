// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/MockUSDC.sol";
import "../contracts/PredictionMarketFactory.sol";
import "../contracts/PredictionMarket.sol";

contract PredictionMarketTest is Test {
    MockUSDC internal usdc;
    PredictionMarketFactory internal factory;
    PredictionMarket internal market;

    address internal admin = address(0xA11CE);
    address internal creator = address(0xB0B);
    address internal oracle = address(0x0C0A11CE);
    address internal alice = address(0xAA01);
    address internal bob = address(0xBB01);

    function setUp() external {
        usdc = new MockUSDC();

        vm.prank(admin);
        factory = new PredictionMarketFactory(admin, creator, oracle, address(usdc));

        usdc.mint(alice, 1_000_000_000);
        usdc.mint(bob, 1_000_000_000);

        vm.prank(creator);
        (uint256 marketId,) = factory.createMarket(block.timestamp + 1 hours);
        market = PredictionMarket(factory.markets(marketId));

        vm.startPrank(alice);
        usdc.approve(address(market), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(market), type(uint256).max);
        vm.stopPrank();
    }

    function testTradeResolveClaim() external {
        vm.prank(alice);
        market.buyYes(100_000_000);

        vm.prank(bob);
        market.buyNo(100_000_000);

        vm.prank(creator);
        market.closeMarket();

        vm.prank(oracle);
        market.resolveMarket(PredictionMarket.Outcome.Yes);

        uint256 beforeBalance = usdc.balanceOf(alice);
        vm.prank(alice);
        market.claim();

        uint256 afterBalance = usdc.balanceOf(alice);
        assertEq(afterBalance - beforeBalance, 200_000_000);
    }

    function testFactoryRevertsOnZeroCreator() external {
        vm.prank(admin);
        vm.expectRevert("creator zero");
        new PredictionMarketFactory(admin, address(0), oracle, address(usdc));
    }

    function testCancelRefund() external {
        vm.prank(alice);
        market.buyYes(50_000_000);

        vm.prank(bob);
        market.buyNo(20_000_000);

        vm.prank(creator);
        market.cancelMarket();

        uint256 beforeBalance = usdc.balanceOf(alice);
        vm.prank(alice);
        market.claim();
        uint256 afterBalance = usdc.balanceOf(alice);

        assertEq(afterBalance - beforeBalance, 50_000_000);
    }

    function testFuzzBuyYes(uint96 amount) external {
        uint256 bounded = bound(uint256(amount), 1, 500_000_000);

        vm.prank(alice);
        market.buyYes(bounded);

        assertEq(market.yesShares(alice), bounded);
        assertEq(market.yesPool(), bounded);
    }

    function testFuzzBuyNo(uint96 amount) external {
        uint256 bounded = bound(uint256(amount), 1, 500_000_000);

        vm.prank(bob);
        market.buyNo(bounded);

        assertEq(market.noShares(bob), bounded);
        assertEq(market.noPool(), bounded);
    }

    function testSellBeforeClose() external {
        vm.prank(alice);
        market.buyYes(80_000_000);

        vm.prank(alice);
        market.sellYes(30_000_000);

        assertEq(market.yesShares(alice), 50_000_000);
        assertEq(market.yesPool(), 50_000_000);
    }
}

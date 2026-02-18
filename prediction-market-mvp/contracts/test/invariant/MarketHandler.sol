// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../contracts/MockUSDC.sol";
import "../../contracts/PredictionMarket.sol";

contract MarketHandler is Test {
    MockUSDC public immutable usdc;
    PredictionMarket public immutable market;
    address[] public users;

    constructor(MockUSDC _usdc, PredictionMarket _market, address[] memory _users) {
        usdc = _usdc;
        market = _market;
        users = _users;

        for (uint256 i = 0; i < users.length; i++) {
            usdc.mint(users[i], 2_000_000_000);
            vm.startPrank(users[i]);
            usdc.approve(address(market), type(uint256).max);
            vm.stopPrank();
        }
    }

    function buyYes(uint256 userSeed, uint96 amount) external {
        address user = users[userSeed % users.length];
        uint256 bounded = _boundedAmount(amount);

        vm.prank(user);
        try market.buyYes(bounded) {} catch {}
    }

    function buyNo(uint256 userSeed, uint96 amount) external {
        address user = users[userSeed % users.length];
        uint256 bounded = _boundedAmount(amount);

        vm.prank(user);
        try market.buyNo(bounded) {} catch {}
    }

    function _boundedAmount(uint96 amount) internal pure returns (uint256) {
        return (uint256(amount) % 100_000_000) + 1;
    }
}

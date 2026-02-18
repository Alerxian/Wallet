// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/MockUSDC.sol";
import "../contracts/PredictionMarketFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address creator = vm.envAddress("CREATOR_ADDRESS");
        address oracle = vm.envAddress("ORACLE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        MockUSDC usdc = new MockUSDC();
        PredictionMarketFactory factory = new PredictionMarketFactory(
            vm.addr(deployerPrivateKey),
            creator,
            oracle,
            address(usdc)
        );

        vm.stopBroadcast();

        console2.log("MockUSDC:", address(usdc));
        console2.log("PredictionMarketFactory:", address(factory));
        console2.log("Creator:", creator);
        console2.log("Oracle:", oracle);
    }
}

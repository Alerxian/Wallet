// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "openzeppelin-contracts/contracts/access/AccessControl.sol";
import "./PredictionMarket.sol";

contract PredictionMarketFactory is AccessControl {
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");

    address public immutable collateralToken;
    address public oracle;
    uint256 public nextMarketId;

    mapping(uint256 => address) public markets;

    event MarketCreated(uint256 indexed marketId, address indexed market, uint256 closeTime);
    event OracleUpdated(address indexed newOracle);

    constructor(address admin, address creator, address initialOracle, address collateral) {
        require(admin != address(0), "admin zero");
        require(creator != address(0), "creator zero");
        require(initialOracle != address(0), "oracle zero");
        require(collateral != address(0), "collateral zero");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CREATOR_ROLE, creator);

        oracle = initialOracle;
        collateralToken = collateral;
    }

    function createMarket(uint256 closeTime) external returns (uint256 marketId, address marketAddress) {
        require(hasRole(CREATOR_ROLE, msg.sender), "not creator");
        require(closeTime > block.timestamp, "close time past");

        marketId = nextMarketId;
        nextMarketId += 1;

        PredictionMarket market = new PredictionMarket(
            msg.sender,
            oracle,
            collateralToken,
            closeTime
        );

        marketAddress = address(market);
        markets[marketId] = marketAddress;

        emit MarketCreated(marketId, marketAddress, closeTime);
    }

    function setOracle(address newOracle) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "not admin");
        require(newOracle != address(0), "oracle zero");

        oracle = newOracle;
        emit OracleUpdated(newOracle);
    }
}

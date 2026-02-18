// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/access/AccessControl.sol";
import "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract PredictionMarket is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    enum MarketStatus {
        Open,
        Closed,
        Resolved,
        Cancelled
    }

    enum Outcome {
        Unresolved,
        Yes,
        No
    }

    IERC20 public immutable collateral;
    uint256 public immutable closeTime;
    uint256 public yesPool;
    uint256 public noPool;
    Outcome public resolvedOutcome;
    MarketStatus public status;

    mapping(address => uint256) public yesShares;
    mapping(address => uint256) public noShares;
    mapping(address => bool) public claimed;

    event Traded(address indexed user, bool indexed isYes, bool indexed isBuy, uint256 amount);
    event MarketClosed();
    event MarketResolved(Outcome outcome);
    event MarketCancelled();
    event Claimed(address indexed user, uint256 payout);

    constructor(
        address admin,
        address oracle,
        address collateralToken,
        uint256 marketCloseTime
    ) {
        require(admin != address(0), "admin zero");
        require(oracle != address(0), "oracle zero");
        require(collateralToken != address(0), "collateral zero");
        require(marketCloseTime > block.timestamp, "close time past");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, oracle);

        collateral = IERC20(collateralToken);
        closeTime = marketCloseTime;
        status = MarketStatus.Open;
        resolvedOutcome = Outcome.Unresolved;
    }

    function buyYes(uint256 amount) external nonReentrant {
        _buy(true, amount);
    }

    function buyNo(uint256 amount) external nonReentrant {
        _buy(false, amount);
    }

    function sellYes(uint256 amount) external nonReentrant {
        _sell(true, amount);
    }

    function sellNo(uint256 amount) external nonReentrant {
        _sell(false, amount);
    }

    function closeMarket() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "not admin");
        require(status == MarketStatus.Open, "not open");

        status = MarketStatus.Closed;
        emit MarketClosed();
    }

    function resolveMarket(Outcome outcome) external {
        require(hasRole(ORACLE_ROLE, msg.sender), "not oracle");
        require(status == MarketStatus.Closed || (status == MarketStatus.Open && block.timestamp >= closeTime), "not closable");
        require(outcome == Outcome.Yes || outcome == Outcome.No, "invalid outcome");

        if (status == MarketStatus.Open) {
            status = MarketStatus.Closed;
            emit MarketClosed();
        }

        resolvedOutcome = outcome;
        status = MarketStatus.Resolved;
        emit MarketResolved(outcome);
    }

    function cancelMarket() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "not admin");
        require(status == MarketStatus.Open || status == MarketStatus.Closed, "cannot cancel");

        status = MarketStatus.Cancelled;
        emit MarketCancelled();
    }

    function claim() external nonReentrant returns (uint256 payout) {
        require(status == MarketStatus.Resolved || status == MarketStatus.Cancelled, "not claimable");
        require(!claimed[msg.sender], "already claimed");

        claimed[msg.sender] = true;

        if (status == MarketStatus.Cancelled) {
            payout = yesShares[msg.sender] + noShares[msg.sender];
        } else {
            uint256 winningShares = resolvedOutcome == Outcome.Yes ? yesShares[msg.sender] : noShares[msg.sender];
            uint256 winningPool = resolvedOutcome == Outcome.Yes ? yesPool : noPool;
            uint256 totalPool = yesPool + noPool;

            if (winningShares == 0 || winningPool == 0) {
                payout = 0;
            } else {
                payout = (winningShares * totalPool) / winningPool;
            }
        }

        if (payout > 0) {
            collateral.safeTransfer(msg.sender, payout);
        }

        emit Claimed(msg.sender, payout);
    }

    function _buy(bool isYes, uint256 amount) internal {
        require(status == MarketStatus.Open, "market not open");
        require(block.timestamp < closeTime, "market closed by time");
        require(amount > 0, "amount zero");

        collateral.safeTransferFrom(msg.sender, address(this), amount);

        if (isYes) {
            yesShares[msg.sender] += amount;
            yesPool += amount;
        } else {
            noShares[msg.sender] += amount;
            noPool += amount;
        }

        emit Traded(msg.sender, isYes, true, amount);
    }

    function _sell(bool isYes, uint256 amount) internal {
        require(status == MarketStatus.Open, "market not open");
        require(block.timestamp < closeTime, "market closed by time");
        require(amount > 0, "amount zero");

        if (isYes) {
            require(yesShares[msg.sender] >= amount, "insufficient yes shares");
            yesShares[msg.sender] -= amount;
            yesPool -= amount;
        } else {
            require(noShares[msg.sender] >= amount, "insufficient no shares");
            noShares[msg.sender] -= amount;
            noPool -= amount;
        }

        collateral.safeTransfer(msg.sender, amount);
        emit Traded(msg.sender, isYes, false, amount);
    }
}

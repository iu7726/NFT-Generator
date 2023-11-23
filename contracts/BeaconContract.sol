// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract BeaconContract {
    UpgradeableBeacon immutable beacon;

    address public vLogic;

    constructor(address _vLogic) {
        beacon = new UpgradeableBeacon(_vLogic);
        vLogic = _vLogic;
    }

    function update(address _vLogic) public {
        beacon.upgradeTo(_vLogic);
        vLogic = _vLogic;
    }

    function implementation() public view returns(address) {
        return beacon.implementation();
    }
}
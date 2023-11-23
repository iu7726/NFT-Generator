// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ERC721Logic2 is ERC721AUpgradeable, OwnableUpgradeable {
    using SafeMath for uint256;

    address public creator;
    address public admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    uint256 public cap;
    uint8 public fee = 5;
    uint16 public wlSupply = 0;
    uint16 public pubSupply = 0;

    struct SaleParam {
        bool active;
        uint256 cost;
        uint16 cap;
        uint32 startTime;
        uint32 endTime;
    }

    mapping(string => SaleParam) public saleConfig;

    modifier isCreator() {
        require(creator == msg.sender, "Is not this contract creator");
        _;
    }

    modifier isAdmin() {
        require(admin == msg.sender, "Is not this contract admin");
        _;
    }

    modifier _saleCheck(string memory round, uint8 _amount) {
        require(saleConfig[round].active, "This nft does not proceed with this sale");
        require(saleConfig[round].startTime <= block.timestamp, "before sales");
        require(saleConfig[round].endTime >= block.timestamp, "Sales over");
        require(_amount > 0, "Purchase quantity must be greater than zero.");
        require(SafeMath.add(totalSupply(), _amount) <= cap, "mint is no longer possible.");
        require(msg.value == SafeMath.mul(_amount, saleConfig[round].cost), "not eligible for ethers value");
        _;
    } 

    function initialize(
        string calldata name, 
        string calldata symbol,
        address _creator,
        uint256 _cap,
        SaleParam calldata wlParam,
        SaleParam calldata pubParam
    ) initializerERC721A initializer public{

        __ERC721A_init(name, symbol);
        __Ownable_init();

        creator = _creator;
        cap = _cap;

        if (wlParam.active) {
            saleConfig["WL"] = wlParam;
        }

        if (pubParam.active) {
            saleConfig["PUB"] = pubParam;
        }

    }

    function getCreator() external view returns (address) {
        return creator;
    }

    function getCap() external view returns (uint256) {
        return cap;
    }

    function buyWlNft(uint8 _amount) external payable _saleCheck("WL", _amount) {
        require(SafeMath.add(wlSupply, _amount) <= saleConfig["WL"].cap, "WL mint is no longer possible.");

        wlSupply += 1;

        _mint(msg.sender, _amount);
    }

    function buyPubNft(uint8 _amount) external payable _saleCheck("PUB", _amount) {
        require(SafeMath.add(pubSupply, _amount) <= saleConfig["PUB"].cap, "PUB mint is no longer possible.");

        pubSupply += 1;

        _mint(msg.sender, _amount);
    }

    function setAdmin(address _admin) public isAdmin {
        admin = _admin;
    }

    function getAdmin() public view returns (address) {
        return admin;
    }
    
    function setFee(uint8 _fee) external {
        require(fee == _fee, "not change");

        fee = _fee;
    }

    function getFee() external view returns (uint8) {
        return fee;
    }

    function withdraw() external payable isCreator {
        (bool feeos, ) = admin.call{value: address(this).balance * fee / 100}("");
        require(feeos);

        (bool os, ) = payable(creator).call{value: address(this).balance}("");
        
        require(os);
    }
}
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./BeaconContract.sol";

contract Factory is Ownable, ReentrancyGuard, IERC721Receiver {
    using Counters for Counters.Counter;
    Counters.Counter private _idxNft;

    BeaconContract immutable nftBeacon;

    struct Product {
        address creater;
        address nft;
    }

    struct SaleParam {
        uint256 txAmount;
        uint256 cost;
        uint256 cap;
        uint32 startTime;
        uint32 endTime;
        bytes32 merkleRoot;
        bool active;
    }

    struct NftCollateral {
        bool active;
        address nftAddress;
        uint256 tokenId;
    }

    struct CreateInfo {
        SaleParam wlParam;
        SaleParam pubParam;
        SaleParam teamParam;
        NftCollateral nftParam;
        uint256 cap;
        string nftName; 
        string nftSymbol;
        string ogCollection;
        string baseUri;
        bool reveal;
    }

    struct CreateInfoPrivate {
        SaleParam saleParam;
        SaleParam teamParam;
        NftCollateral nftParam;
        uint256 cap;
        string nftName; 
        string nftSymbol;
        string ogCollection;
        string baseUri;
        bool reveal;
    }

    string constant text = "initialize(((uint256,uint256,uint256,uint32,uint32,bytes32,bool),(uint256,uint256,uint256,uint32,uint32,bytes32,bool),(uint256,uint256,uint256,uint32,uint32,bytes32,bool),(bool,address,uint256),uint256,string,string,string,string,bool),address)";
    bytes4 private constant FUNC_SELECTOR_NFT = bytes4(keccak256(abi.encodePacked(text)));
    string constant privateSaleFunc = "initialize(((uint256,uint256,uint256,uint32,uint32,bytes32,bool),(uint256,uint256,uint256,uint32,uint32,bytes32,bool),(bool,address,uint256),uint256,string,string,string,string,bool),address)";
    bytes4 private constant PRIVATE_FUNC_SELECTOR_NFT = bytes4(keccak256(abi.encodePacked(privateSaleFunc)));

    event ChangeLogic(address indexed owner, address indexed logicAddress);
    event Create(address indexed creater, address nftAddress, uint256 indexed nftId, string indexed ogCollection);
    event Collateral(address indexed owner, address indexed productAddress, address indexed nftAddress, uint256 tokenId);
    event Received(address indexed operator, address indexed from, uint256 tokenId);

    mapping(uint256 => Product) private products;
    mapping(address => address[]) private nfts;
    mapping(address => uint256[]) private _ownerByProductId;

    constructor(address _vLogic) {
        nftBeacon = new BeaconContract(_vLogic);
    }

    function create(
        CreateInfo calldata _info 
    ) external returns (address) {
        require(bytes(_info.nftName).length > 0, "name is empty");
        require(bytes(_info.nftSymbol).length > 0, "symbol is empty");
        require(_info.wlParam.active || _info.pubParam.active, "Invalid sales information(active)");
        uint256 totalCap = 0;
        if (_info.wlParam.active) {
            require(
                (_info.wlParam.startTime < _info.wlParam.endTime) &&
                _info.wlParam.endTime != 0 && _info.wlParam.startTime != 0 &&
                _info.wlParam.endTime - _info.wlParam.startTime <= 30 days,
                "Invalid private sales time"
            );
            require(
                _info.wlParam.txAmount > 0 && 
                _info.wlParam.txAmount <= _info.wlParam.cap, 
                "Invalid WL txAmount"
            );
            require(_info.wlParam.merkleRoot > 0, "Invalid Merkle Tree");
            totalCap = SafeMath.add(totalCap, _info.wlParam.cap);
        }

        if (_info.pubParam.active) {
            require(
                (_info.pubParam.startTime < _info.pubParam.endTime) &&
                _info.pubParam.endTime != 0 && _info.pubParam.startTime != 0 &&
                _info.pubParam.endTime - _info.pubParam.startTime <= 30 days,
                "Invalid public sales time"
            );
            require(
                _info.pubParam.txAmount > 0 &&
                _info.pubParam.txAmount <= _info.pubParam.cap, 
                "Invalid PUB txAmount"
            );
            totalCap = SafeMath.add(totalCap, _info.pubParam.cap);
        }

        if (_info.teamParam.active) {
            require(_info.teamParam.cap > 0, "team cap is zero");
            totalCap = SafeMath.add(totalCap, _info.teamParam.cap);
        }
        require(totalCap == _info.cap, "Invalid sales information(cap)");
        if (_info.wlParam.active && _info.pubParam.active) {
            require(_info.pubParam.startTime >= _info.wlParam.endTime, "Not End of Sale");
        }

        // Create NFT Contract
        BeaconProxy proxy = new BeaconProxy(
            address(nftBeacon),
            abi.encodeWithSelector(
                FUNC_SELECTOR_NFT, 
                _info,
                msg.sender
            )
        );

        _idxNft.increment();
        products[_idxNft.current()] = Product(msg.sender, address(proxy));
        nfts[msg.sender].push(address(proxy));
        _ownerByProductId[msg.sender].push(_idxNft.current());

        emit Create(msg.sender, address(proxy), _idxNft.current(), _info.ogCollection);

        if (_info.nftParam.active) {
            IERC721 nftContract = IERC721(_info.nftParam.nftAddress);
            require(_info.nftParam.nftAddress > address(0), "Is not NFT Contract");
            require(nftContract.ownerOf(_info.nftParam.tokenId) == msg.sender, "Is not NFT Owner");

            nftContract.setApprovalForAll(address(proxy), true);
            nftContract.safeTransferFrom(msg.sender, address(proxy), _info.nftParam.tokenId);

            emit Collateral(msg.sender, address(proxy), _info.nftParam.nftAddress, _info.nftParam.tokenId);
        }

        return address(proxy);
    }

    function createPrivate(
        CreateInfoPrivate calldata _info
    ) external returns (address) {
        require(bytes(_info.nftName).length > 0, "name is empty");
        require(bytes(_info.nftSymbol).length > 0, "symbol is empty");
        require(_info.saleParam.active, "Invalid sales information(active)");
        uint256 totalCap = 0;

        require(
            (_info.saleParam.startTime < _info.saleParam.endTime) &&
            _info.saleParam.endTime != 0 && _info.saleParam.startTime != 0 &&
            _info.saleParam.endTime - _info.saleParam.startTime <= 30 days,
            "Invalid private sales time"
        );
        require(
            _info.saleParam.txAmount > 0 && 
            _info.saleParam.txAmount <= _info.saleParam.cap, 
            "Invalid WL txAmount"
        );
        require(_info.saleParam.merkleRoot > 0, "Invalid Merkle Tree");
        totalCap = SafeMath.add(totalCap, _info.saleParam.cap);

        if (_info.teamParam.active) {
            require(_info.teamParam.cap > 0, "team cap is zero");
            totalCap = SafeMath.add(totalCap, _info.teamParam.cap);
        }
        require(totalCap == _info.cap, "Invalid sales information(cap)");

        // Create NFT Contract
        BeaconProxy proxy = new BeaconProxy(
            address(nftBeacon),
            abi.encodeWithSelector(
                PRIVATE_FUNC_SELECTOR_NFT, 
                _info,
                msg.sender
            )
        );

        _idxNft.increment();
        products[_idxNft.current()] = Product(msg.sender, address(proxy));
        nfts[msg.sender].push(address(proxy));
        _ownerByProductId[msg.sender].push(_idxNft.current());

        emit Create(msg.sender, address(proxy), _idxNft.current(), _info.ogCollection);

        if (_info.nftParam.active) {
            IERC721 nftContract = IERC721(_info.nftParam.nftAddress);
            require(_info.nftParam.nftAddress > address(0), "Is not NFT Contract");
            require(nftContract.ownerOf(_info.nftParam.tokenId) == msg.sender, "Is not NFT Owner");

            nftContract.setApprovalForAll(address(proxy), true);
            nftContract.safeTransferFrom(msg.sender, address(proxy), _info.nftParam.tokenId);

            emit Collateral(msg.sender, address(proxy), _info.nftParam.nftAddress, _info.nftParam.tokenId);
        }

        return address(proxy);
    }

    function getNFTImplementation() public view returns (address) {
        return nftBeacon.implementation();
    }

    function getNftBeacon() public view returns (address) {
        return address(nftBeacon);
    }

    function totalCreate() public view returns (uint256) {
        return _idxNft.current();
    }

    function getNft(address creater, uint256 x) public view returns (address) {
        return nfts[creater][x];
    }

    function getNfts(address creater) public view returns (address[] memory) {
        return nfts[creater];
    }

    function upgradeNftLogic(address _logic) public onlyOwner {
        nftBeacon.update(_logic);
    }

    function getProductOwner(uint256 _productId) public view returns (address) {
        return products[_productId].creater;
    }

    function getNftByProductId(uint256 _productId) public view returns (address) {
        return products[_productId].nft;
    }

    function getNftProducts() public view returns (address[] memory) {
        uint256 count = SafeMath.add(totalSupply(), 1);
        address[] memory nftAddress = new address[](count);

        unchecked {
            for (uint256 i = 1; i <= count; i++) {
                nftAddress[i] = getNftByProductId(i);
            }
        }
        
        return nftAddress;
    }

    function totalSupply() public view returns (uint256) {
        return _idxNft.current();
    }

    function ownerOfProduct(address owner) public view returns (uint256[] memory) {
        return _ownerByProductId[owner];
    }

    function onERC721Received(
        address _operator, 
        address _from, 
        uint256 _tokenId, 
        bytes calldata _data
    ) external override returns (bytes4) {
        _data;
        emit Received(_operator, _from, _tokenId);

        return 0x150b7a02;
    }

}
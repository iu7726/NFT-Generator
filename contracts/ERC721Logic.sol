// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol"; 
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract ERC721Logic is ERC721AUpgradeable, OwnableUpgradeable, IERC721Receiver {
    using SafeMath for uint256;
    using Strings for uint256;

    address public creator;
    address public admin;
    uint256 public timelock;
    uint256 public cap;
    uint8 public fee;
    string public baseUri;
    uint8 public revealCnt;
    bool public reveal;
    uint256 public wlSupply;
    uint256 public pubSupply;
    bool public teamMinted;
    uint256 private privateSupply;
    uint256 private publicSupply;
    uint256 public _startPubToken;
    uint256 private _mintTeamToken;

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

    event Withdraw(address creator, address admin, uint256 payment, uint256 fee);
    event Refund(address refunder, address admin, uint256 tokenId, uint256 price);
    event ArtistMint(address creator, uint256 quantity);
    event TeamMint(address creator, uint256 quantity);
    event SetBaseUri(string baseUri, uint256 revealCnt);
    event Revealed(string baseUri);
    event Received(address indexed operator, address indexed from, uint256 tokenId);

    mapping(string => SaleParam) public saleConfig;
    NftCollateral private nftCollateral;

    modifier isCreator() {
        require(creator == msg.sender, "Is not this contract creator");
        _;
    }

    modifier isAdmin() {
        require(admin == msg.sender, "Is not this contract admin");
        _;
    }

    function initialize(
        CreateInfo calldata _info,
        address _creator
    ) initializerERC721A initializer public{

        __ERC721A_init(_info.nftName, _info.nftSymbol);
        __Ownable_init();

        creator = _creator;
        cap = _info.cap;
        fee = 5;
        admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        baseUri = _info.baseUri;
        reveal = _info.reveal;

        if (_info.wlParam.active) {
            saleConfig["WL"] = _info.wlParam;
            timelock = _info.wlParam.endTime + 7 days;
        }

        if (_info.pubParam.active) {
            saleConfig["PUB"] = _info.pubParam;
            timelock = _info.pubParam.endTime + 7 days;
        }

        if (_info.teamParam.active) {
            saleConfig["TEAM"] = _info.teamParam;
        }

        if (_info.nftParam.active) {
            nftCollateral = _info.nftParam;
        }

    }

    function getCreator() external view returns (address) {
        return creator;
    }

    function getCap() external view returns (uint256) {
        return cap;
    }

    function buyPrivateNft(uint8 _amount, bytes32[] calldata _merkleProof) external payable {
        SaleParam memory nowSale = saleConfig["WL"];
        uint256 nowTime = block.timestamp;
        require(nowSale.active, "NotSale");
        require(nowSale.startTime <= nowTime && nowSale.endTime >= nowTime, "NotSaleTime");
        require(nowSale.txAmount >= _amount, "TooMany");
        require(msg.value == SafeMath.mul(_amount, nowSale.cost), "NotEnough");
        require(SafeMath.add(totalSupply(), _amount) <= nowSale.cap, "MaxMintedPrivate");

        checkValidity(_merkleProof);
        
        _mint(msg.sender, _amount);
    }

    function buyPublicNft(uint256 _amount) external payable {
        SaleParam memory nowSale = saleConfig["PUB"];
        uint256 nowTime = block.timestamp;
        require(nowSale.active, "NotSale");
        require(nowSale.startTime <= nowTime && nowSale.endTime >= nowTime, "NotSaleTime");
        require(nowSale.txAmount >= _amount, "TooMany");
        require(msg.value == SafeMath.mul(_amount, nowSale.cost), "NotEnough");

        uint256 supply = totalSupply();
        require(SafeMath.add(supply, _amount) <= cap, "MaxMintedPublic");

        if (_startPubToken == 0 ) _startPubToken = supply;

        _mint(msg.sender, _amount);
    }

    function setAdmin(address _admin) public isAdmin {
        admin = _admin;
    }

    function setSaleConfig(
        SaleParam calldata _wlParam, 
        SaleParam calldata _pubParam,
        SaleParam calldata _teamParam
    ) public isCreator {
        require(totalSupply() > 0, "Sales have started and cannot be changed");
        require(_wlParam.active || _pubParam.active, "Invalid sales information(active)");
        uint256 _cap = 0;
        if (_wlParam.active) {
            require(
                (_wlParam.startTime < _wlParam.endTime) &&
                _wlParam.endTime != 0 && _wlParam.startTime != 0 &&
                _wlParam.endTime - _wlParam.startTime <= 30 days,
                "Invalid sales time"
            );
            require(
                _wlParam.txAmount > 0 && 
                _wlParam.txAmount <= _wlParam.cap, 
                "Invalid WL txAmount"
            );
            require(_wlParam.merkleRoot > 0, "Invalid Merkle Tree");
            _cap = SafeMath.add(_cap, _wlParam.cap);
            timelock = _wlParam.endTime + 7 days;
        }

        if (_pubParam.active) {
            require(
                (_pubParam.startTime < _pubParam.endTime) &&
                _pubParam.endTime != 0 && _pubParam.startTime != 0 &&
                _pubParam.endTime - _pubParam.startTime <= 30 days,
                "Invalid sales time"
            );
            require(
                _pubParam.txAmount > 0 &&
                _pubParam.txAmount <= _pubParam.cap, 
                "Invalid PUB txAmount"
            );
            _cap = SafeMath.add(_cap, _pubParam.cap);
            timelock = _pubParam.endTime + 7 days;
        }

        if (_teamParam.active) {
            require(_teamParam.cap > 0, "team cap is zero");
            _cap = SafeMath.add(_cap, _teamParam.cap);
        }

        require(_cap == cap, "Invalid sales information(cap)");

        if (_wlParam.active && _pubParam.active) {
            require(_pubParam.startTime >= _wlParam.endTime, "Not End of Sale");
        }

        saleConfig["WL"] = _wlParam;
        saleConfig["PUB"] = _pubParam;
        saleConfig["TEAM"] = _teamParam;
    }

    function revealed(string calldata _baseUri) public isCreator {
        require( ! reveal, "Already Revealed");

        reveal = true;
        revealCnt++;
        baseUri = _baseUri;

        emit Revealed(_baseUri);
        emit SetBaseUri(baseUri, revealCnt);
    }

    function setBaseUri(string calldata _baseUri) public isCreator {
        require(revealCnt < 2, "Reveal Count Exceeded");
        revealCnt++;
        baseUri = _baseUri;

        emit SetBaseUri(_baseUri, revealCnt);
    }

    function getAdmin() public view returns (address) {
        return admin;
    }
    
    function setFee(uint8 _fee) external {
        require(fee == _fee, "not change");

        fee = _fee;
    }

    function getTimeLock() public view returns (uint256) {
        return timelock;
    }

    function getMintingFee() public view returns (uint256) {
        return SafeMath.div(SafeMath.mul(address(this).balance, fee), 100);
    }

    function getPayment() public view returns (uint256) {
        return SafeMath.sub(address(this).balance, getMintingFee());
    }

    function getBlockTime() public view returns (uint256) {
        return block.timestamp;
    }

    function getSaleInfo(string calldata _round) public view returns (SaleParam memory) {
        return saleConfig[_round];
    }

    function getCollateralInfo() public view returns (NftCollateral memory) {
        return nftCollateral;
    }

    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "Nonexistent token");

        if ( ! reveal) return baseUri;

        return bytes(baseUri).length > 0
        ? string(abi.encodePacked(baseUri, _tokenId.toString(), ".json"))
        : "";
    }

    function teamMint() public isCreator {
        require( ! teamMinted, "Already Team Minted");

        teamMinted = true;
        _mintTeamToken = totalSupply();
        saleConfig["WL"].cap += saleConfig["TEAM"].cap;
        saleConfig["PUB"].cap += saleConfig["TEAM"].cap;
        _mint(msg.sender, saleConfig["TEAM"].cap);

        emit TeamMint(msg.sender, saleConfig["TEAM"].cap);
    }

    function artistMint() public isCreator {
        require(block.timestamp >= timelock, "Not Artist Mint Period");
        require(totalSupply() < cap, "no quantity to mint");
        uint256 amount = SafeMath.sub(cap, totalSupply());
        _mint(msg.sender, amount);

        emit ArtistMint(msg.sender, amount);
    }

    function refund(address to, uint256 tokenId) public {
        uint256 price = (tokenId < _startPubToken) ? saleConfig["WL"].cost : saleConfig["PUB"].cost;
        require(block.timestamp >= timelock - 7 days, "Not Refund Period");
        require(block.timestamp <= timelock, "Not Refund Period");
        require(totalSupply() != cap, "Not a refund condition");
        require(price > 0, "FreeMint is non-refundable");
        require(ownerOf(tokenId) == msg.sender, "Not the NFT Owner");
        if (teamMinted) {
            require(
                _mintTeamToken <= tokenId && 
                saleConfig["TEAM"].cap + _mintTeamToken <= tokenId, 
                "IsTeamNFT"
            );
        }

        safeTransferFrom(_msgSender(), creator, tokenId);

        (bool success, ) = to.call{value: price}("");
        require(success, "fail refund");

        emit Refund(to, admin, tokenId, price);
    }

    function withdraw() external payable isCreator {
        require(block.timestamp >= timelock, "not time to withdraw money");
        
        (bool feeos, ) = payable(admin).call{value: getMintingFee()}("");
        require(feeos);

        (bool os, ) = payable(creator).call{value: getPayment()}("");
        require(os);

        emit Withdraw(creator, admin, getMintingFee(), getPayment());

        if (nftCollateral.active) {
            IERC721(nftCollateral.nftAddress).safeTransferFrom(address(this), msg.sender, nftCollateral.tokenId);
            nftCollateral.active = false;
        }
    }

    function checkValidity(bytes32[] calldata _merkleProof) public view returns (bool){
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(_merkleProof, saleConfig["WL"].merkleRoot, leaf), 
            "Incorrect proof"
        );
        return true; // Or you can mint tokens here
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
import { expect } from "chai";
import { BigNumber } from "ethers";
import { Factory, ERC721Logic, ERC721PrivateLogic } from "../typechain";
import { setAddresses, getMerkleRoot, getMerkleProof } from "../lib/merkleTree";
import moment from "moment";

const { ethers, network } = require('hardhat');
const ERC721LogicJson = require("../artifacts/contracts/ERC721Logic.sol/ERC721Logic.json");
const erc721ABI = ERC721LogicJson.abi;
const ERC721LogicJson2 = require("../artifacts/contracts/ERC721Logic2.sol/ERC721Logic2.json");
const erc721ABI2 = ERC721LogicJson2.abi;

let factory:Factory;
let owner:any, artist1:any, artist2:any, collecter1:any, collecter2:any;
let erc721: ERC721PrivateLogic;

const parseEther = (val:BigNumber | string) => ethers.utils.parseEther(val.toString());
const formatEther = (val:BigNumber | string) => ethers.utils.formatEther(val.toString());
const unixFormat = (val: number) => moment.unix(val).format("YYYY-MM-DD HH:mm");
const evmAddDays = async (val: number) => {
    val *= 86400;
    await network.provider.send("evm_increaseTime", [val]);
    await network.provider.send("evm_mine");
}

const _createInfo = () => {
    return {
        nftName: '',
        nftSymbol: '',
        ogCollection: '',
        cap: 0,
        baseUri: 'https://abce.db/',
        reveal: false,
        saleParam: {
            active: false,
            cost: parseEther("0.01"),
            cap: 0,
            startTime: 0,
            endTime: 0,
            txAmount: 0,
            merkleRoot: ethers.utils.formatBytes32String(""),
        },
        teamParam: {
            active: false,
            cost: parseEther("0"),
            cap: 0,
            startTime: 0,
            endTime: 0,
            txAmount: 0,
            merkleRoot: ethers.utils.formatBytes32String(""),
        },
        nftParam: {
            active: false,
            nftAddress: "0x0000000000000000000000000000000000000000",
            tokenId: 0,
        }
    }
}

describe("ERC721 NFT Generator", function () {
    before("Deploy", async () => {
        [owner, artist1, artist2, collecter1, collecter2] = await ethers.getSigners();

        const ERC721Logic = await ethers.getContractFactory("ERC721PrivateLogic");
        erc721 = await ERC721Logic.deploy();

        await erc721.deployed();

        const Factory = await ethers.getContractFactory("Factory");
        factory = await Factory.deploy(erc721.address);

        await factory.deployed();

        expect(await factory.getNFTImplementation()).to.equal(erc721.address);
    });

    /*
    * 
    * Create NFT Contract
    * 
    */
    it("Should revert Create NFT, because name is empty", async () => {
        const createInfo = _createInfo();

        await expect(
            factory.connect(artist1).createPrivate(createInfo)
        ).to.revertedWith("name is empty")
    });

    it("Should revert Create NFT, because symbol is empty", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';

        await expect(
            factory.connect(artist1).createPrivate(createInfo)
        ).to.revertedWith("symbol is empty")
    });

    it("Should revert Create NFT, because Invalid sales information(active)", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 10;

        await expect(
            factory.connect(artist1).createPrivate(createInfo)
        ).to.revertedWith("Invalid sales information(active)")
    });

    it("Should revert Create NFT, because Invalid sales information(cap)", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 10;

        
        createInfo.saleParam.active = true;
        createInfo.saleParam.startTime = moment().unix();
        createInfo.saleParam.endTime = moment().add(1, "day").unix();
        createInfo.saleParam.txAmount = 5;
        createInfo.saleParam.cap = 100;
        setAddresses([collecter1.address]);
        createInfo.saleParam.merkleRoot = getMerkleRoot();

        await expect(
            factory.connect(artist1).createPrivate(createInfo)
        ).to.revertedWith("Invalid sales information(cap)")
    });

    it("Should revert Create NFT, because value out-of-bounds", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 10;

        createInfo.saleParam.active = true;
        createInfo.saleParam.cap = 101;
        
        try {
            factory.connect(artist1).createPrivate(createInfo)
        } catch (err:any) {
            expect(err.message).to.contain('value out-of-bounds');
        }
    });

    it("Should revert Create NFT, because value out-of-bounds", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 50;

        createInfo.saleParam.active = true;
        createInfo.saleParam.cap = 50;

        try {
            factory.connect(artist1).createPrivate(createInfo)
        } catch (err:any) {
            expect(err.message).to.contain('value out-of-bounds');
        }
    });

    it("Should revert Create NFT, because Invalid sales time", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 50;

        createInfo.saleParam.active = true;
        createInfo.saleParam.cap = 50;
        createInfo.saleParam.startTime = moment().unix();
        createInfo.saleParam.endTime = moment().unix();
        createInfo.saleParam.txAmount = 2;
        createInfo.saleParam.merkleRoot = getMerkleRoot();

        await expect(
            factory.connect(artist1).createPrivate(createInfo)
        ).to.revertedWith('Invalid private sales time');
    });

    it("Should revert Create NFT, because Invalid WL txAmount", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 2;

        createInfo.saleParam.active = true;
        createInfo.saleParam.cap = 2;
        createInfo.saleParam.startTime = moment().unix();
        createInfo.saleParam.endTime = moment().add(14, "day").unix();

        await expect(
            factory
                .connect(artist1)
                .createPrivate(createInfo)
        ).to.revertedWith("Invalid WL txAmount");

        createInfo.saleParam.txAmount = 3;

        await expect(
            factory
                .connect(artist1)
                .createPrivate(createInfo)
        ).to.revertedWith("Invalid WL txAmount");
    })

    it("Should revert Create NFT, because Invalid Merkle Tree", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 2;

        createInfo.saleParam.active = true;
        createInfo.saleParam.cap = 2;
        createInfo.saleParam.startTime = moment().unix();
        createInfo.saleParam.endTime = moment().add(14, "day").unix();
        createInfo.saleParam.txAmount = 2;

        await expect(
            factory
                .connect(artist1)
                .createPrivate(createInfo)
        ).to.revertedWith("Invalid Merkle Tree");
    })

    it("Should revert Create NFT, because cap is zero", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';

        createInfo.saleParam.active = true;
        createInfo.saleParam.cap = 2;
        createInfo.saleParam.txAmount = 2;
        createInfo.saleParam.startTime = moment().unix();
        createInfo.saleParam.endTime = moment().add(1, "day").unix();
        createInfo.saleParam.merkleRoot = getMerkleRoot();

        await expect(
            factory.connect(artist1).createPrivate(createInfo)
        ).to.revertedWith("Invalid sales information(cap)")
    });

    it("Should success Create NFT", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 2;

        createInfo.saleParam.active = true;
        createInfo.saleParam.cap = 2;
        createInfo.saleParam.txAmount = 2;
        createInfo.saleParam.startTime = moment().unix();
        createInfo.saleParam.endTime = moment().add(1, "day").unix();
        createInfo.saleParam.merkleRoot = getMerkleRoot();

        // only wl mint
        await expect(
            await factory
                .connect(artist1)
                .createPrivate(createInfo)
        ).to.emit(factory, "Create");

        await expect(
            (await factory.connect(artist1).getNfts(artist1.address))[0]
        ).to.equal(await factory.connect(artist1).getNft(artist1.address, 0))

        // 1day after mint
        createInfo.saleParam.startTime = moment().add(1, 'day').unix();
        createInfo.saleParam.endTime = moment().add(2, "day").unix();

        await expect(
            await factory
                .connect(artist2)
                .createPrivate(createInfo)
        ).to.emit(factory, "Create");
    });
});
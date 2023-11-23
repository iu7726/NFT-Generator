import { expect } from "chai";
import { BigNumber } from "ethers";
import { Factory, ERC721Logic } from "../typechain";
import { setAddresses, getMerkleRoot, getMerkleProof } from "../lib/merkleTree";
import moment from "moment";

const { ethers, network } = require('hardhat');
const ERC721LogicJson = require("../artifacts/contracts/ERC721Logic.sol/ERC721Logic.json");
const erc721ABI = ERC721LogicJson.abi;
let factory: Factory;
let owner: any, artist1: any, artist2: any, collecter1: any, collecter2: any;
let erc721: ERC721Logic, erc7212: ERC721Logic2;

const parseEther = (val: BigNumber | string) => ethers.utils.parseEther(val.toString());
const formatEther = (val: BigNumber | string) => ethers.utils.formatEther(val.toString());
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
        wlParam: {
            active: false,
            cost: parseEther("0.01"),
            cap: 0,
            startTime: 0,
            endTime: 0,
            txAmount: 0,
            merkleRoot: ethers.utils.formatBytes32String(""),
        },
        pubParam: {
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

        const ERC721Logic = await ethers.getContractFactory("ERC721Logic");
        erc721 = await ERC721Logic.deploy();

        const ERC721Logic2 = await ethers.getContractFactory("ERC721Logic2");
        erc7212 = await ERC721Logic2.deploy();

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
            factory.connect(artist1).create(createInfo)
        ).to.revertedWith("name is empty")
    });

    it("Should revert Create NFT, because symbol is empty", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';

        await expect(
            factory.connect(artist1).create(createInfo)
        ).to.revertedWith("symbol is empty")
    });

    it("Should revert Create NFT, because Invalid sales information(active)", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 10;

        await expect(
            factory.connect(artist1).create(createInfo)
        ).to.revertedWith("Invalid sales information(active)")
    });

    it("Should revert Create NFT, because Invalid sales information(cap)", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 10;


        createInfo.wlParam.active = true;
        createInfo.wlParam.startTime = moment().unix();
        createInfo.wlParam.endTime = moment().add(1, "day").unix();
        createInfo.wlParam.txAmount = 5;
        createInfo.wlParam.cap = 100;
        setAddresses([collecter1.address]);
        createInfo.wlParam.merkleRoot = getMerkleRoot();

        createInfo.pubParam.active = true;
        createInfo.pubParam.txAmount = 1;
        createInfo.pubParam.cap = 1;
        createInfo.pubParam.startTime = moment().add(2, "day").unix();
        createInfo.pubParam.endTime = moment().add(3, "day").unix();

        await expect(
            factory.connect(artist1).create(createInfo)
        ).to.revertedWith("Invalid sales information(cap)")
    });

    it("Should revert Create NFT, because value out-of-bounds", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 10;

        createInfo.wlParam.active = true;
        createInfo.wlParam.cap = 101;

        try {
            factory.connect(artist1).create(createInfo)
        } catch (err: any) {
            expect(err.message).to.contain('value out-of-bounds');
        }
    });

    it("Should revert Create NFT, because value out-of-bounds", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 100;

        createInfo.wlParam.active = true;
        createInfo.wlParam.cap = 50;

        createInfo.pubParam.cap = 50;

        try {
            factory.connect(artist1).create(createInfo)
        } catch (err: any) {
            expect(err.message).to.contain('value out-of-bounds');
        }
    });

    it("Should revert Create NFT, because Invalid sales time", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 50;

        createInfo.wlParam.active = true;
        createInfo.wlParam.cap = 50;
        createInfo.wlParam.startTime = moment().unix();
        createInfo.wlParam.endTime = moment().unix();
        createInfo.wlParam.txAmount = 2;
        createInfo.wlParam.merkleRoot = getMerkleRoot();

        await expect(
            factory.connect(artist1).create(createInfo)
        ).to.revertedWith('Invalid private sales time');

        createInfo.wlParam.endTime = moment().add(1, "day").unix();

        createInfo.pubParam.cap = 50;
        createInfo.pubParam.startTime = moment().add(2, "day").unix();
        createInfo.pubParam.active = true;

        createInfo.cap = 100;

        await expect(
            factory.connect(artist1).create(createInfo)
        ).to.revertedWith('Invalid public sales time');

        createInfo.pubParam.endTime = moment().add(50, "day").unix();

        await expect(
            factory.connect(artist1).create(createInfo)
        ).to.revertedWith('Invalid public sales time');
    });

    it("Should revert Create NFT, because Invalid WL txAmount", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 2;

        createInfo.wlParam.active = true;
        createInfo.wlParam.cap = 2;
        createInfo.wlParam.startTime = moment().unix();
        createInfo.wlParam.endTime = moment().add(14, "day").unix();

        await expect(
            factory
                .connect(artist1)
                .create(createInfo)
        ).to.revertedWith("Invalid WL txAmount");

        createInfo.wlParam.txAmount = 3;

        await expect(
            factory
                .connect(artist1)
                .create(createInfo)
        ).to.revertedWith("Invalid WL txAmount");
    })

    it("Should revert Create NFT, because Invalid Merkle Tree", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 4;

        createInfo.wlParam.active = true;
        createInfo.wlParam.cap = 2;
        createInfo.wlParam.startTime = moment().unix();
        createInfo.wlParam.endTime = moment().add(14, "day").unix();
        createInfo.wlParam.txAmount = 2;

        await expect(
            factory
                .connect(artist1)
                .create(createInfo)
        ).to.revertedWith("Invalid Merkle Tree");
    })

    it("Should revert Create NFT, because Incorrect PUB txAmount", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 4;

        createInfo.wlParam.active = true;
        createInfo.wlParam.cap = 2;
        createInfo.wlParam.startTime = moment().unix();
        createInfo.wlParam.endTime = moment().add(14, "day").unix();
        createInfo.wlParam.txAmount = 2;
        setAddresses([collecter1.address]);
        createInfo.wlParam.merkleRoot = getMerkleRoot();

        createInfo.pubParam.active = true;
        createInfo.pubParam.cap = 2;
        createInfo.pubParam.startTime = moment().add(15, "day").unix();
        createInfo.pubParam.endTime = moment().add(16, "day").unix();

        await expect(
            factory
                .connect(artist1)
                .create(createInfo)
        ).to.revertedWith("Invalid PUB txAmount");
    })

    it("Should revert Create NFT, because cap is zero", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';

        createInfo.wlParam.active = true;
        createInfo.wlParam.cap = 2;
        createInfo.wlParam.txAmount = 2;
        createInfo.wlParam.startTime = moment().unix();
        createInfo.wlParam.endTime = moment().add(1, "day").unix();
        createInfo.wlParam.merkleRoot = getMerkleRoot();

        await expect(
            factory.connect(artist1).create(createInfo)
        ).to.revertedWith("Invalid sales information(cap)")
    });

    it("Should success Create NFT", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 2;

        createInfo.wlParam.active = true;
        createInfo.wlParam.cap = 2;
        createInfo.wlParam.txAmount = 2;
        createInfo.wlParam.startTime = moment().unix();
        createInfo.wlParam.endTime = moment().add(1, "day").unix();
        createInfo.wlParam.merkleRoot = getMerkleRoot();

        // only wl mint
        await expect(
            await factory
                .connect(artist1)
                .create(createInfo)
        ).to.emit(factory, "Create");

        await expect(
            (await factory.connect(artist1).getNfts(artist1.address))[0]
        ).to.equal(await factory.connect(artist1).getNft(artist1.address, 0))

        // 1day after mint
        createInfo.wlParam.startTime = moment().add(1, 'day').unix();
        createInfo.wlParam.endTime = moment().add(2, "day").unix();

        await expect(
            await factory
                .connect(artist2)
                .create(createInfo)
        ).to.emit(factory, "Create");

        // wl, pub contract
        createInfo.wlParam.startTime = moment().unix();
        createInfo.cap = 4;

        createInfo.pubParam.active = true;
        createInfo.pubParam.cap = 2;
        createInfo.pubParam.txAmount = 2;
        createInfo.pubParam.startTime = moment().add(15, 'day').unix();
        createInfo.pubParam.endTime = moment().add(16, 'day').unix();

        await expect(
            await factory
                .connect(artist2)
                .create(createInfo)
        ).to.emit(factory, "Create");
    });

    it("Should product owner check by productId", async () => {
        await expect(
            await factory
                .connect(artist1)
                .getProductOwner(1)
        ).to.equal(artist1.address);
    })

    it("Should product nft address check by productId", async () => {
        await expect(
            await factory
                .connect(artist1)
                .getNftByProductId(1)
        ).to.equal(
            await factory
                .connect(artist1)
                .getNft(artist1.address, 0)
        );
    })

    it("Should productId by owner", async () => {
        const productIds = await factory.ownerOfProduct(artist1.address);
        const product: any = await factory.getProductOwner(productIds[0]);

        await expect(product).to.equal(artist1.address);
    })

    /*
    *
    *  NFT Contract Mint
    *
    */
    it("Should revert NFT Mint, because NotSale", async () => {
        const artist1Nft1Address = await factory.connect(collecter1).getNft(artist1.address, 0);
        const artist1Nft1 = new ethers.Contract(artist1Nft1Address, erc721ABI, collecter1);

        await expect(
            artist1Nft1.buyPublicNft(1, {
                from: collecter1.address,
            })
        ).to.revertedWith("NotSale");
    });

    it("Should revert NFT Mint, because NotSaleTime", async () => {
        const artist2Nft1Address = await factory.connect(collecter1).getNft(artist2.address, 0);
        const artist2Nft1 = new ethers.Contract(artist2Nft1Address, erc721ABI, collecter1);
        setAddresses([collecter1.address]);

        await expect(
            artist2Nft1.buyPrivateNft(1, getMerkleProof(collecter1.address), {
                from: collecter1.address,
                value: 0,
            })
        ).to.revertedWith("NotSaleTime");
    });

    it("Should revert NFT Mint, because MintZeroQuantity()", async () => {
        const artist1Nft1Address = await factory.connect(collecter1).getNft(artist1.address, 0);
        const artist1Nft1 = new ethers.Contract(artist1Nft1Address, erc721ABI, collecter1);

        await expect(
            artist1Nft1.buyPrivateNft(
                0,
                getMerkleProof(collecter1.address),
                {
                    from: collecter1.address,
                    value: parseEther("0")
                }
            )
        ).to.revertedWith("MintZeroQuantity()");
    })

    it("Should revert NFT mint, because NotEnough", async () => {
        const artist1Nft1Address = await factory.connect(collecter1).getNft(artist1.address, 0);
        const artist1Nft1 = new ethers.Contract(artist1Nft1Address, erc721ABI, collecter1);

        await expect(
            artist1Nft1.buyPrivateNft(
                2,
                getMerkleProof(collecter1.address),
                {
                    from: collecter1.address,
                    value: parseEther("0.01")
                }
            )
        ).to.revertedWith("NotEnough");
    })

    it("Should revert NFT private mint, beacuse Incorrect proof", async () => {
        const nftAddress = await factory.connect(collecter2).getNft(artist1.address, 0);
        const nft = new ethers.Contract(nftAddress, erc721ABI, collecter2);

        await expect(
            nft.buyPrivateNft(
                1,
                getMerkleProof(collecter1.address),
                {
                    from: collecter2.address,
                    value: parseEther("0.01")
                }
            )
        ).to.revertedWith("Incorrect proof");

    })

    it("Should success NFT Mint", async () => {
        const artist1Nft1Address = await factory.connect(collecter1).getNft(artist1.address, 0);
        const artist1Nft1 = new ethers.Contract(artist1Nft1Address, erc721ABI, collecter1);

        await expect(
            await artist1Nft1.buyPrivateNft(
                2,
                getMerkleProof(collecter1.address),
                {
                    from: collecter1.address,
                    value: parseEther("0.02")
                }
            )
        ).to.emit(artist1Nft1, "Transfer");
    })

    it("Should revert NFT mint, because MaxMintedPrivate", async () => {
        const artist1Nft1Address = await factory.connect(collecter1).getNft(artist1.address, 0);
        const artist1Nft1 = new ethers.Contract(artist1Nft1Address, erc721ABI, collecter1);

        await expect(
            artist1Nft1.buyPrivateNft(
                1,
                getMerkleProof(collecter1.address),
                {
                    from: collecter1.address,
                    value: parseEther("0.01")
                }
            )
        ).to.revertedWith("MaxMintedPrivate");
    })

    it("Should change Logic code", async () => {
        await factory.connect(owner).upgradeNftLogic(erc7212.address)
        await expect(
            await factory.connect(owner).getNFTImplementation()
        ).to.equal(erc7212.address);

        await factory.connect(owner).upgradeNftLogic(erc721.address)
    })

    /*
    *
    * withdraw function
    *
    */
    it("Should revert withdraw, because Is not this contract creator", async () => {
        const nftAddress = await factory.connect(collecter1).getNft(artist1.address, 0);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI);

        await expect(
            erc721
                .connect(collecter1)
                .withdraw()
        ).to.revertedWith("Is not this contract creator");
    })

    it("Should revert withdraw, because not time to withdraw money", async () => {
        const nftAddress = await factory.connect(collecter1).getNft(artist1.address, 0);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, artist1);

        await expect(
            erc721
                .connect(artist1)
                .withdraw()
        ).to.revertedWith("not time to withdraw money");
    })

    it("Should success withdraw", async () => {
        const nftAddress = await factory.connect(collecter1).getNft(artist1.address, 0);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, artist1);

        // block chain time set
        // artist1 sale end time +14 days
        await network.provider.send("evm_increaseTime", [1814400]); // + 21 days
        await network.provider.send("evm_mine");

        const beforeOwnerBalance = await owner.getBalance();
        const beforeArtist1Balance = await artist1.getBalance();

        await expect(
            formatEther(await erc721.getMintingFee())
        ).to.equal("0.001");

        await expect(
            formatEther(await erc721.getPayment())
        ).to.equal("0.019");

        await expect(
            await erc721
                .connect(artist1)
                .withdraw({ from: artist1.address })
        ).to.emit(erc721, "Withdraw");

        await expect(
            formatEther((await owner.getBalance()).sub(beforeOwnerBalance))
        ).to.equal("0.001");

        await expect(
            await artist1.getBalance()
        ).to.above(beforeArtist1Balance);

        await network.provider.send("evm_increaseTime", [-1814400]); // - 21 days
        await network.provider.send("evm_mine");
    })

    /*
    *
    * Refund Test
    * 
    */

    it("Should Refund NFT Contract Create And Mint", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 20;

        createInfo.wlParam.active = true;
        createInfo.wlParam.cap = 10;
        createInfo.wlParam.cost = parseEther("0.01");
        createInfo.wlParam.txAmount = 3;
        createInfo.wlParam.startTime = moment().unix();
        createInfo.wlParam.endTime = moment().add(1, "day").unix();
        setAddresses([collecter1.address]);
        createInfo.wlParam.merkleRoot = getMerkleRoot();

        createInfo.pubParam.active = true;
        createInfo.pubParam.cap = 10;
        createInfo.pubParam.cost = parseEther("0.1");
        createInfo.pubParam.txAmount = 3;
        createInfo.pubParam.startTime = moment().add(1, "day").unix();
        createInfo.pubParam.endTime = moment().add(2, "day").unix();

        await factory.connect(artist2).create(createInfo);

        const nftAddress = await factory.connect(collecter1).getNft(artist2.address, 2);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, collecter1);

        await erc721
            .buyPrivateNft(
                1,
                getMerkleProof(collecter1.address),
                { from: collecter1.address, value: parseEther("0.01") }
            );

        // time set wl sale end pub sale start
        await evmAddDays(1); // + 1 days

        await erc721
            .buyPublicNft(1, { from: collecter1.address, value: parseEther("0.1") });

        const erc721Col2 = new ethers.Contract(nftAddress, erc721ABI, collecter2);
        await erc721Col2
            .buyPublicNft(1, { from: collecter2.address, value: parseEther("0.1") });

        await evmAddDays(-1);
    })

    it("Should revert refund, because Not Refund Period", async () => {
        const nftAddress = await factory.connect(collecter1).getNft(artist2.address, 2);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, collecter1);

        await expect(
            erc721.connect(collecter1).refund(collecter1.address, 0)
        ).to.revertedWith("Not Refund Period");
    })

    it("Should revert refund, because Not a refund condition", async () => {
        const nftAddress = await factory.connect(collecter1).getNft(artist1.address, 0);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, collecter1);

        await evmAddDays(5);

        await expect(
            erc721.connect(collecter1).refund(collecter1.address, 0)
        ).to.revertedWith("Not a refund condition");

        await evmAddDays(-5);
    })

    it("Should revert refund, because FreeMint is non-refundable", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'NFTest';
        createInfo.nftSymbol = 'NT';
        createInfo.cap = 10;

        createInfo.wlParam.active = true;
        createInfo.wlParam.cost = parseEther("0");
        createInfo.wlParam.cap = 10;
        createInfo.wlParam.txAmount = 5;
        createInfo.wlParam.startTime = moment().unix();
        createInfo.wlParam.endTime = moment().add(1, "day").unix();
        setAddresses([collecter1.address]);
        createInfo.wlParam.merkleRoot = getMerkleRoot();

        await factory.connect(artist2).create(createInfo);

        const nftAddress = await factory.connect(collecter1).getNft(artist2.address, 3);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, collecter1);
        await erc721.connect(collecter1).buyPrivateNft(
            1,
            getMerkleProof(collecter1.address),
            { from: collecter1.address }
        );

        await evmAddDays(1);

        await expect(
            erc721.connect(collecter1).refund(collecter1.address, 0)
        ).to.revertedWith("FreeMint is non-refundable");

        await evmAddDays(-1);
    })


    it("Should success refund", async () => {
        // time set refund time
        await evmAddDays(2); // + 2 days

        const nftAddress = await factory.connect(collecter1).getNft(artist2.address, 2);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, collecter1);
        const beforeCollect1 = await collecter1.getBalance();
        // wl refund token 0
        await expect(
            await erc721
                .connect(collecter1)
                .refund(collecter1.address, 0)
        ).to.emit(erc721, "Refund");

        await expect(artist2.address).to.equal(await erc721.ownerOf(0));

        await expect(
            await erc721
                .connect(collecter2)
                .refund(collecter2.address, 2)
        ).to.emit(erc721, "Refund");

        await evmAddDays(-2);
    })

    it("Should revert refund, because Not the NFT Owner", async () => {
        const nftAddress = await factory.connect(collecter1).getNft(artist2.address, 2);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, collecter2);

        await evmAddDays(2);

        await expect(
            erc721
                .connect(collecter2)
                .refund(collecter2.address, 1)
        ).to.revertedWith("Not the NFT Owner");

        await evmAddDays(-2);
    })

    /*
     * 
     * Artist Mint 
     * 
     */

    it("Should artistMint function test setting", async () => {
        const createInfo = _createInfo();
        createInfo.nftName = 'ArtistMintTest';
        createInfo.nftSymbol = 'AMT';
        createInfo.cap = 4;

        createInfo.wlParam.active = true;
        createInfo.wlParam.cost = parseEther("1");
        createInfo.wlParam.cap = 2;
        createInfo.wlParam.txAmount = 2;
        createInfo.wlParam.startTime = moment().unix();
        createInfo.wlParam.endTime = moment().add(1, "day").unix();
        setAddresses([collecter1.address]);
        createInfo.wlParam.merkleRoot = getMerkleRoot();

        createInfo.pubParam.active = true;
        createInfo.pubParam.cost = parseEther("2");
        createInfo.pubParam.cap = 2;
        createInfo.pubParam.txAmount = 2;
        createInfo.pubParam.startTime = moment().add(1, "day").unix();
        createInfo.pubParam.endTime = moment().add(2, "day").unix();

        await expect(
            await factory
                .connect(artist1)
                .create(createInfo)
        ).to.emit(factory, "Create");

        const nftAddress = await factory.getNft(artist1.address, 1);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI);

        await erc721.connect(collecter1).buyPrivateNft(
            1,
            getMerkleProof(collecter1.address),
            { from: collecter1.address, value: parseEther("1") }
        );
    })

    it("Should revert artistMint, because Is not this contract creator", async () => {
        const nftAddress = await factory.getNft(artist1.address, 1);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI);

        await expect(
            erc721
                .connect(collecter1)
                .artistMint()
        ).to.revertedWith("Is not this contract creator");
    })

    it("Should revert artisMint, because Not Artist Mint Period", async () => {
        const nftAddress = await factory.getNft(artist1.address, 1);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI);

        await expect(
            erc721
                .connect(artist1)
                .artistMint()
        ).to.revertedWith("Not Artist Mint Period");
    })

    it("SHould revert artistMint, beacuse no quantity to mint", async () => {
        const nftAddress = await factory.getNft(artist1.address, 0);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI);

        await evmAddDays(22);

        await expect(
            erc721
                .connect(artist1)
                .artistMint()
        ).to.revertedWith("no quantity to mint");

        await evmAddDays(-22);
    })

    it("Should success artisMint", async () => {
        const nftAddress = await factory.getNft(artist1.address, 1);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, artist1);
        const mintCap = (await erc721.getCap()).sub(await erc721.totalSupply());

        await evmAddDays(10);

        await expect(
            await erc721
                .connect(artist1)
                .artistMint({ from: artist1.address })
        ).to.emit(erc721, "ArtistMint");

        await evmAddDays(-10);

        await expect(await erc721.balanceOf(artist1.address)).to.equal(mintCap.toNumber());
    })

    /**
     * 
     *  TeamMint
     * 
     * * */

    it("Should Create TeamMint Test Contract", async () => {
        const info = _createInfo();
        info.nftName = "TeamMintTest";
        info.nftSymbol = "TMT";
        info.cap = 4;

        info.pubParam.active = true;
        info.pubParam.cap = 2;
        info.pubParam.txAmount = 1;
        info.pubParam.cost = 0;
        info.pubParam.startTime = moment().unix();
        info.pubParam.endTime = moment().add(1, "day").unix();

        info.teamParam.active = true;
        info.teamParam.cap = 2;

        await expect(
            await factory
                .connect(artist1)
                .create(info)
        ).to.emit(factory, "Create");

    })

    it("Should revert TeamMint, because Is not this contract creator", async () => {
        const nftAddress = await factory.getNftByProductId(await factory.totalCreate());
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, collecter1);

        await expect(
            erc721.teamMint()
        ).to.revertedWith("Is not this contract creator");
    })

    it("Should success TeamMint", async () => {
        const nftAddress = await factory.getNftByProductId(await factory.totalCreate());
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, artist1);

        await expect(
            await erc721
                .teamMint()
        ).to.emit(erc721, "TeamMint");
    })

    it("Should revert TeamMint, because Already Team Minted", async () => {
        const nftAddress = await factory.getNftByProductId(await factory.totalCreate());
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, artist1);

        await expect(
            erc721.teamMint()
        ).to.revertedWith("Already Team Minted");
    })

    /***
     * 
     * SetBaseUri
     * 
     */
    it("Should revert reveal, because Is not this contract creator", async () => {
        const nftAddress = await factory.getNftByProductId(1);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, collecter1);

        await expect(
            erc721.revealed("aaaa")
        ).to.revertedWith("Is not this contract creator");
    })

    it("Should success reveal", async () => {
        const nftAddress = await factory.getNftByProductId(1);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, artist1);

        const beforeBaseUri = await erc721.tokenURI(1);

        await expect(
            await erc721.revealed("ipfs://abcd/")
        ).to.emit(erc721, "Revealed");

        await expect(beforeBaseUri).to.not.equal(await erc721.tokenURI(1));
    })

    it("Should revert reveal, because Already Revealed", async () => {
        const nftAddress = await factory.getNftByProductId(1);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, artist1);

        await expect(
            erc721.revealed("ipfs://abcdd/")
        ).to.revertedWith("Already Revealed");
    })

    it("Should revert setBaseUri, because Is not this contract creator", async () => {
        const nftAddress = await factory.getNftByProductId(1);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, collecter1);

        await expect(
            erc721.setBaseUri("hihi")
        ).to.revertedWith("Is not this contract creator");
    })

    it("Should success setBaseUri", async () => {
        const nftAddress = await factory.getNftByProductId(1);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, artist1);

        await expect(
            await erc721.setBaseUri("ipfs://bascsd/")
        ).to.emit(erc721, "SetBaseUri");

        await expect(
            await erc721.tokenURI(1)
        ).to.equal("ipfs://bascsd/1.json");
    })

    it("Should revert setBaseUri, because Reveal Count Exceeded", async () => {
        const nftAddress = await factory.getNftByProductId(1);
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, artist1);

        await expect(
            erc721.setBaseUri("ipfs://bascsdd/")
        ).to.revertedWith("Reveal Count Exceeded");
    })

    /***
     * 
     * Nft Collateral
     * 
     */

    it("Should revert Create (Nft Collateral), because Is not NFT Contract", async () => {
        const _info = _createInfo();
        _info.nftName = "NftCollateral";
        _info.nftSymbol = "NC";
        _info.cap = 4;
        _info.baseUri = "ipfs://notReveal";
        _info.reveal = false;

        _info.pubParam.active = true;
        _info.pubParam.cap = 4;
        _info.pubParam.cost = parseEther("0");
        _info.pubParam.txAmount = 4;
        _info.pubParam.startTime = moment().unix();
        _info.pubParam.endTime = moment().add(1, "day").unix();

        _info.nftParam.active = true;

        await expect(
            factory
                .connect(artist1)
                .create(_info)
        ).to.revertedWith("Is not NFT Contract");
    })

    it("Should revert Create (Nft Collateral), because OwnerQueryForNonexistentToken()", async () => {
        const _info = _createInfo();
        _info.nftName = "NftCollateral";
        _info.nftSymbol = "NC";
        _info.cap = 4;
        _info.baseUri = "ipfs://notReveal";
        _info.reveal = false;

        _info.pubParam.active = true;
        _info.pubParam.cap = 4;
        _info.pubParam.cost = parseEther("0");
        _info.pubParam.txAmount = 4;
        _info.pubParam.startTime = moment().unix();
        _info.pubParam.endTime = moment().add(1, "day").unix();

        _info.nftParam.active = true;
        _info.nftParam.nftAddress = await factory.getNftByProductId(1);
        _info.nftParam.tokenId = 2;

        await expect(
            factory
                .connect(artist2)
                .create(_info)
        ).to.revertedWith("OwnerQueryForNonexistentToken()");
    })

    it("Should revert Create (Nft Collateral), because Is not NFT Owner", async () => {
        const _info = _createInfo();
        _info.nftName = "NftCollateral";
        _info.nftSymbol = "NC";
        _info.cap = 4;
        _info.baseUri = "ipfs://notReveal";
        _info.reveal = false;

        _info.pubParam.active = true;
        _info.pubParam.cap = 4;
        _info.pubParam.cost = parseEther("0");
        _info.pubParam.txAmount = 4;
        _info.pubParam.startTime = moment().unix();
        _info.pubParam.endTime = moment().add(1, "day").unix();

        _info.nftParam.active = true;
        _info.nftParam.nftAddress = await factory.getNftByProductId(1);
        _info.nftParam.tokenId = 1;

        await expect(
            factory
                .connect(artist2)
                .create(_info)
        ).to.revertedWith("Is not NFT Owner");
    })

    it("Should success Create (Nft Collateral)", async () => {
        const _info = _createInfo();
        _info.nftName = "NftCollateral";
        _info.nftSymbol = "NC";
        _info.cap = 4;
        _info.baseUri = "ipfs://notReveal";
        _info.reveal = false;

        _info.pubParam.active = true;
        _info.pubParam.cap = 4;
        _info.pubParam.cost = parseEther("0");
        _info.pubParam.txAmount = 4;
        _info.pubParam.startTime = moment().unix();
        _info.pubParam.endTime = moment().add(1, "day").unix();

        _info.nftParam.active = true;
        _info.nftParam.nftAddress = await factory.getNft(artist1.address, 1);
        _info.nftParam.tokenId = 2;
        const erc721 = new ethers.Contract(_info.nftParam.nftAddress, erc721ABI, artist1);

        await erc721.approve(factory.address, 2);

        await expect(
            factory
                .connect(artist1)
                .create(_info)
        ).to.emit(factory, "Collateral");


        await expect(
            await erc721.ownerOf(2)
        ).to.equal(await factory.getNftByProductId(await factory.totalCreate()));
    })

    it("Should success withdraw (Nft Collateral)", async () => {
        const nftAddress = await factory.getNftByProductId(await factory.totalCreate());
        const erc721 = new ethers.Contract(nftAddress, erc721ABI, collecter1);

        await erc721.buyPublicNft(4, {
            from: collecter1.address,
            value: 0
        });

        await evmAddDays(10);

        const erc721Owner = new ethers.Contract(nftAddress, erc721ABI, artist1);

        await erc721Owner.withdraw();

        const erc721Collateral = new ethers.Contract(await factory.getNft(artist1.address, 1), erc721ABI, artist1);

        await expect(
            await erc721Collateral.ownerOf(2)
        ).to.equal(artist1.address);

        await evmAddDays(-10);
    })

});
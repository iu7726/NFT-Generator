const {MerkleTree} = require("merkletreejs")
const keccak256 = require("keccak256")

let addresses: string[] = [];

const getLeaves = () => {
    return addresses.map(addr => keccak256(addr));
};

const setAddresses = (_addresses: string[]) => {
    addresses = _addresses;
};

const getMerkleTree = () => {
    return new MerkleTree(getLeaves(), keccak256, {sortPairs: true});
}

const getMerkleRoot = () => {
    const merkleTree = getMerkleTree();
    return merkleTree.getRoot();
}

const getMerkleProof = (_addr:string) => {
    const merkleTree = getMerkleTree();
    return merkleTree.getHexProof(keccak256(_addr));
}

const verify = (_addr:string) => {
    const merkleTree = getMerkleTree();
    return merkleTree.verify(getMerkleProof(_addr), keccak256(_addr), getMerkleRoot());
}

export {
    getLeaves,
    setAddresses,
    getMerkleTree,
    getMerkleRoot,
    getMerkleProof,
    verify,
}
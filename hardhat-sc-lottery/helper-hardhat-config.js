const { ethers } = require("hardhat");

const networkConfig = {
  5: {
    name: "goerli",
    vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    subscriptionId: "2065",
    gasLane:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    interval: "30",
    entranceFee: ethers.utils.parseEther("0.01"),
    callbackGasLimit: "500000",
  },
  31337: {
    name: "hardhat",
    gasLane:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 30 gwei
    interval: "30",
    entranceFee: ethers.utils.parseEther("0.01"),
    callbackGasLimit: "500000", // 500,000 gas
  },
};

const developmentChains = ["hardhat", "localhost"];
const frontEndContractsFile =
  "../nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json";
const frontEndAbiFile =
  "../nextjs-smartcontract-lottery-fcc/constants/abi.json";

module.exports = {
  networkConfig,
  developmentChains,
  frontEndContractsFile,
  frontEndAbiFile,
};

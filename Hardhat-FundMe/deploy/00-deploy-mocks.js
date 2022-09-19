// function deployFunc(hre) {
//   console.log("hi");
// hre.getNamedAccounts()
// hre.deployments
// }

// module.exports.default = deployFunc;

// -------------------- or use function like This --------------------------

const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  //   const chainId = network.config.chainId;

  //   network.name === chainId

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log("Mock deployed!");
    log("-----------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];

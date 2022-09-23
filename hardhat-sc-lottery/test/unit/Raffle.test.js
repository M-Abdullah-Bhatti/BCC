const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
const { network, deployments, getNamedAccounts, ethers } = require("hardhat");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle unit test", async function () {
      let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        raffle = await ethers.getContract("Raffle", deployer);
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        raffleEntranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();
      });

      //   1-----------------------------------------------------------------
      describe("constructor", async function () {
        it("initializes the raffle correctly", async () => {
          // Ideally we make our test have just 1 assert per "it"
          const raffleState = (await raffle.getRaffleState()).toString();
          const interval = (await raffle.getInterval()).toString();
          assert.equal(raffleState, "0");
          assert.equal(
            interval,
            networkConfig[network.config.chainId]["interval"]
          );
        });
      });

      //   2-----------------------------------------------------------------

      describe("enterRaffle", async function () {
        it("reverts when you don't pay enough", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWith(
            // is reverted when not paid enough or raffle is not open
            "Raffle__NotEnoughETHEntered"
          );
        });
        it("records player when they enter", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const contractPlayer = await raffle.getPlayer(0);
          assert.equal(contractPlayer, deployer);
        });
        it("emits event on enter", async () => {
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.emit(
            // emits RaffleEnter event if entered to index player(s) address
            raffle,
            "RaffleEnter"
          );
        });

        it("doesn't allow entrance when raffle is calculating", async () => {
          // we are making our application to change in calculation state so that we can check
          await raffle.enterRaffle({ value: raffleEntranceFee });

          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          // we pretend to be a keeper for a second
          await raffle.performUpkeep([]); // changes the state to calculating for our comparison below
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.be.revertedWith(
            // is reverted as raffle is calculating
            "Raffle__RaffleNotOpen"
          );
        });
      });

      //   3-----------------------------------------------------------------
      describe("checkUpKeep", async function () {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(!upkeepNeeded);
        });
        it("returns false if raffle isn't open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await raffle.performUpkeep([]); // changes the state to calculating
          const raffleState = await raffle.getRaffleState(); // stores the new state
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert.equal(raffleState.toString() == "1", upkeepNeeded == false);
        });
        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() - 1,
          ]); // use a higher number here if this test fails
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(!upkeepNeeded);
        });
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(upkeepNeeded);
        });
      });

      //   4-----------------------------------------------------------------
      describe("performUpKeep", function () {
        it("it can only run if checkup keep is true", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          // we want our checkupkepp to return true
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx = await raffle.performUpkeep("0x");
          assert(tx);
        });
        it("reverts if checkup is false", async () => {
          await expect(raffle.performUpkeep("0x")).to.be.revertedWith(
            "Raffle__UpkeepNotNeeded"
          );
        });
        it("updates the raffle state and emits a requestId", async () => {
          // Too many asserts in this test!
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const txResponse = await raffle.performUpkeep("0x"); // emits requestId
          const txReceipt = await txResponse.wait(1); // waits 1 block
          const raffleState = await raffle.getRaffleState(); // updates state
          const requestId = txReceipt.events[1].args.requestId;
          assert(requestId.toNumber() > 0);
          assert(raffleState == 1); // 0 = open, 1 = calculating
        });
      });

      //   5-----------------------------------------------------------------
      describe("fulfillRandomWords", function () {
        beforeEach(async function () {
          await raffle.enterRaffle({ value: raffleEntranceFee }); // someone enter the lottery
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]); // increase the time
          await network.provider.send("evm_mine", []); // min a new block
        });
        it("can only be called after performupkeep", async function () {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address) // reverts if not fulfilled
          ).to.be.revertedWith("nonexistent request");
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address) // reverts if not fulfilled
          ).to.be.revertedWith("nonexistent request");
        });
        // This test is too big...
        // This test simulates users entering the raffle and wraps the entire functionality of the raffle
        // inside a promise that will resolve if everything is successful.
        // An event listener for the WinnerPicked is set up
        // Mocks of chainlink keepers and vrf coordinator are used to kickoff this winnerPicked event
        // All the assertions are done once the WinnerPicked event is fired
        it("picks a winner, resets the lottery, and sends money", async function () {
          const additionalEntrants = 3; // to test
          const startingAccountIndex = 1; // bcoz deployer = 0
          const accounts = await ethers.getSigners();
          // i = 1; i < 4; i=i+1
          for (
            let i = startingAccountIndex;
            i < startingAccountIndex + additionalEntrants;
            i++
          ) {
            const accountConnectedRaffle = raffle.connect(accounts[i]); // Returns a new instance of the Raffle contract connected to player
            await accountConnectedRaffle.enterRaffle({
              value: raffleEntranceFee,
            });
          }
          const startingTimeStamp = await raffle.getLastTimeStamp(); // stores starting timestamp (before we fire our event)
          //  performUpkeep (mock being Chainlink keepers)
          // fulfillRandomWords (mock being Chainlink  VRF)
          await new Promise(async (resolve, reject) => {
            raffle.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired!");
              // assert throws an error if it fails, so we need to wrap
              // it in a try/catch so that the promise returns event
              // if it fails.
              try {
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const endingTimeStamp = await raffle.getLastTimeStamp();
                const numPlayers = await raffle.getNumberOfPlayers();
                const winnerEndingBalance = await accounts[1].getBalance();
                // await expect(raffle.getPlayer(0)).to.be.reverted
                assert.equal(numPlayers.toString(), "0");
                assert.equal(raffleState, 0);
                // =================
                assert.equal(
                  winnerEndingBalance.toString(),
                  winnerStartingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                    .add(
                      raffleEntranceFee
                        .mul(additionalEntrants)
                        .add(raffleEntranceFee)
                    )
                    .toString()
                );
                // =================
                assert(endingTimeStamp > startingTimeStamp);
              } catch (e) {
                reject(e);
              }

              resolve();
            });
            // Setting up the listener
            // kicking off the event by mocking the chainlink keepers and vrf coordinator and the listener will pick it up and resolve
            const tx = await raffle.performUpkeep([]);
            const txReceipt = await tx.wait(1);
            const winnerStartingBalance = await accounts[1].getBalance();
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              txReceipt.events[1].args.requestId,
              raffle.address
            );
          });
        });
      });
    });

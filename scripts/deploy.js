// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("ethers");

const hre = require("hardhat");

async function main() {
  let [signer1, signer2] = await hre.ethers.getSigners() ;

  //get contracts and deploy them
  const Bank = await hre.ethers.getContractFactory("Bank", signer1);
  const bank = await Bank.deploy();
  const Matic = await hre.ethers.getContractFactory("Matic", signer2);
  const matic = await Matic.deploy();
  const Shib = await hre.ethers.getContractFactory("Shib", signer2);
  const shib = await Shib.deploy();
  const Usdt = await hre.ethers.getContractFactory("Usdt", signer2);
  const usdt = await Usdt.deploy();

  await bank.whitelistTokens(
    ethers.utils.formatBytes32String("Matic"),  //Because the Fn accepts bytes32 string, it should use this format as a parameter
    matic.address
  );

  await bank.whitelistTokens(
    ethers.utils.formatBytes32String("Shib"),  //Because the Fn accepts bytes32 string, it should use this format as a parameter
    shib.address
  );

  await bank.whitelistTokens(
    ethers.utils.formatBytes32String("Usdt"),  //Because the Fn accepts bytes32 string, it should use this format as a parameter
    usdt.address
  );

  await bank.whitelistTokens(
    ethers.utils.formatBytes32String("ETH"),  //Because the Fn accepts bytes32 string, it should use this format as a parameter
    "0xe17c907bdd37639aaf030f2039ce5bea34adcc42"
  );

  console.log(`Bank contract deployed to: ${bank.address} by ${signer1.address}`);
  console.log(`Matic contract deployed to: ${matic.address} by ${signer2.address}`);
  console.log(`Shib contract deployed to: ${shib.address} by ${signer2.address}`);
  console.log(`Tether contract deployed to: ${usdt.address} by ${signer2.address}`);

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

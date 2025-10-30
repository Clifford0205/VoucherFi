import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import FactoryERC1155ABI from "../artifacts/contracts/FactoryERC1155.sol/FactoryERC1155.json";
import { Log } from "hardhat-deploy/dist/types";

/**
 * Deploys an ERC1155Token contract instance via the FactoryERC1155
 * This creates an actual contract deployment that will be tracked by hardhat-deploy
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployVoucherFiToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { get } = hre.deployments;

  // Get the deployed FactoryERC1155 contract
  const factoryDeployment = await get("FactoryERC1155");
  if (!factoryDeployment) {
    throw new Error("FactoryERC1155 must be deployed first");
  }

  const factory = await hre.ethers.getContractAt("FactoryERC1155", factoryDeployment.address);

  // Deploy a new ERC1155Token via the factory
  const tx = await factory.deployERC1155(
    "VoucherFi",
    "https://voucherfi.com/api/token/",
    [
      100, 100100, 100101, 100102, 100103, 100104, 100200, 100201, 100202, 100203, 100204, 100300, 100301, 100302,
      100303, 100304,
    ],
    [
      "membership",
      "voucher0",
      "voucher1",
      "voucher2",
      "voucher3",
      "voucher4",
      "ticker0",
      "ticker1",
      "ticket2",
      "ticket3",
      "ticket4",
      "coupon0",
      "coupon1",
      "coupon2",
      "coupon3",
      "coupon4",
    ],
  );

  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Transaction receipt not found");
  }

  // Parse the event to get the deployed contract address
  const contractInterface = new hre.ethers.Interface(FactoryERC1155ABI.abi);
  const event = receipt.logs
    .map(log => {
      try {
        return contractInterface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find(parsedLog => parsedLog && parsedLog.name === "ERC1155Created");

  if (!event || !event.args || !event.args.tokenContract) {
    throw new Error("ERC1155Created event not found in transaction receipt");
  }

  const tokenContractAddress = event.args.tokenContract as string;

  // Save the deployment info using hardhat-deploy
  // Note: We use save() instead of deploy() since the contract was created via the factory
  const ERC1155TokenArtifact = await hre.artifacts.readArtifact("ERC1155Token");

  await hre.deployments.save("VoucherFiToken", {
    address: tokenContractAddress,
    abi: ERC1155TokenArtifact.abi,
    // Factory-created contracts don't have a full receipt, but we can reference the transaction
    receipt: {
      blockNumber: receipt.blockNumber,
      transactionHash: receipt.hash,
      transactionIndex: receipt.index,
      blockHash: receipt.blockHash,
      from: receipt.from,
      cumulativeGasUsed: receipt.gasUsed.toString(),
      gasUsed: receipt.gasUsed.toString(),
      to: receipt.to ?? undefined,
      logs: receipt.logs as unknown as Log[],
    },
  });

  console.log(`✅ VoucherFiToken deployed at: ${tokenContractAddress}`);
};

export default deployVoucherFiToken;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags VoucherFiToken
deployVoucherFiToken.tags = ["VoucherFiToken"];
deployVoucherFiToken.dependencies = ["FactoryERC1155"]; // Ensure FactoryERC1155 is deployed first

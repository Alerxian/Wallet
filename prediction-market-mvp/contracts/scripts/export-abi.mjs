import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const outDir = path.join(root, "out");
const targetDir = path.resolve(root, "../backend/src/chain/abi");

const contracts = ["PredictionMarket", "PredictionMarketFactory", "MockUSDC"];

if (!fs.existsSync(outDir)) {
  throw new Error("Foundry output directory not found. Run `forge build` first.");
}

fs.mkdirSync(targetDir, { recursive: true });

for (const contract of contracts) {
  const artifactPath = path.join(outDir, `${contract}.sol`, `${contract}.json`);

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const abiPath = path.join(targetDir, `${contract}.json`);
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
}

console.log(`Exported ABI files to ${targetDir}`);

import { readFile } from "fs";
import path from "path";
import ncp from "ncp";
import { promisify } from "util";

const asyncNcp = promisify(ncp.ncp);
const asyncReadFile = promisify(readFile);

async function commitLine(line) {
  const args = line.split(" ");
  const command = args[0];
  args.shift();
  // call command function
  // await commitMap[command.toLowerCase()](args);
}

const commitMap = {
  from: async (layer) => {
    // move to tmp for processing
    await asyncNcp(`images/${layer}`, `tmp`);
    // change working dir
    process.chdir(`tmp/${layer}`);
  },
  env: (values) => {
    // push to Config.Env[]
  },
};

export default async function (buildImage) {
  if (buildImage === ".") {
    // default local image
    const fullPath = path.resolve(path.dirname(""), "./OurDockerfile");
    const file = await asyncReadFile(fullPath, {
      encoding: "utf-8",
    });
    // good for small files, NOT big ones
    const linesArray = file.split(/\r?\n/);
    linesArray.map(async (line) => {
      await commitLine(line);
    });
  }
}

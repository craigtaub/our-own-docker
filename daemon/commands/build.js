import { readFile, writeFile } from "fs";
import path from "path";
import ncp from "ncp";
import { promisify } from "util";

const asyncNcp = promisify(ncp.ncp);
const asyncReadFile = promisify(readFile);
const asyncWriteFile = promisify(writeFile);

const commitMap = {
  // WORKS
  from: async (layer) => {
    // move to tmp for processing
    const fullPath = path.resolve(path.dirname(""));
    await asyncNcp(`${fullPath}/images/${layer}`, `tmp`);
    // change working dir. could do each via spawn but meh
    process.chdir(`${fullPath}/tmp/`);
  },
  // WORKS
  env: async (values) => {
    const fullPath = path.resolve(path.dirname(""));
    const fullConfig = await import(`${fullPath}/tmp/config.json`);
    const config = fullConfig.default[0];
    if (config.Config.Env) {
      config.Config.Env.push(...values); // merge incoming array into config one
    } else {
      config.Config.Env = values;
    }
    await asyncWriteFile(
      `${fullPath}/tmp/config.json`,
      JSON.stringify([config])
    );
  },
};

async function commitLine(line) {
  const args = line.split(" ");
  const command = args[0];
  if (!command) return; // empty line or something
  args.shift();
  // call command function
  if (!commitMap[command.toLowerCase()]) return; // instruction not processed yet
  await commitMap[command.toLowerCase()](args);
}

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

import { readFile, writeFile, copyFile, mkdir } from "fs";
import path from "path";
import ncp from "ncp";
import { promisify } from "util";
import rimraf from "rimraf";

const asyncNcp = promisify(ncp.ncp);
const asyncReadFile = promisify(readFile);
const asyncWriteFile = promisify(writeFile);
const asyncCopyFile = promisify(copyFile);
const asyncRimraf = promisify(rimraf.sync);
const asyncMkdir = promisify(mkdir);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const utils = {
  getFullPath: () => path.resolve(path.dirname("")),
  grabConfig: async () => {
    await delay(1000);
    const fullPath = utils.getFullPath();
    const fullConfig = await import(`${fullPath}/tmp/config.json`);
    return fullConfig.default[0];
  },
  updateConfig: async (config) => {
    // const fullPath = path.resolve(path.dirname(""));
    const fullPath = utils.getFullPath();
    return asyncWriteFile(
      `${fullPath}/tmp/config.json`,
      JSON.stringify([config])
    );
  },
};
const commitMap = {
  from: async (layer) => {
    // move to tmp for processing
    const fullPath = utils.getFullPath();
    await asyncNcp(`${fullPath}/images/${layer}`, `tmp`);
    // remove diff as specific to layer
    await asyncRimraf(`${fullPath}/tmp/diff`, {});
    // change working dir. could do each via spawn but meh
    // process.chdir(`${fullPath}/tmp/`);
  },
  env: async (values) => {
    const config = await utils.grabConfig();
    if (config.Config.Env) {
      config.Config.Env.push(...values); // merge incoming array into config one
    } else {
      config.Config.Env = values;
    }
    await utils.updateConfig(config);
  },
  workdir: async ([value]) => {
    const config = await utils.grabConfig();
    config.Config.WorkingDir = value; // a string
    await utils.updateConfig(config);
  },
  copy: async (values) => {
    const fullPath = utils.getFullPath();
    const cpyLoc = values.pop();
    // required for diff deletion to finish
    await delay(1000);
    values.map(async (file) => {
      // create folder recusrively
      await asyncMkdir(`${fullPath}/tmp/diff${cpyLoc}/`, { recursive: true });
      // copy files
      await asyncCopyFile(file, `${fullPath}/tmp/diff${cpyLoc}/${file}`);
    });
    // TODO update tmp/lower to tmp/middle
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

import { readFile, writeFile, copyFile, mkdir } from "fs";
import path from "path";
import ncp from "ncp";
import { promisify } from "util";
import rimraf from "rimraf";

export const asyncNcp = promisify(ncp.ncp);
export const asyncReadFile = promisify(readFile);
export const asyncWriteFile = promisify(writeFile);
export const asyncCopyFile = promisify(copyFile);
export const asyncRimraf = promisify(rimraf.sync);
export const asyncMkdir = promisify(mkdir);
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

export default utils;

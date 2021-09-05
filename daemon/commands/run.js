import { spawn } from "child_process";
import { unlinkSync, readFile } from "fs";
import ncp from "ncp";
import path from "path";
import { promisify } from "util";

const asyncNcp = promisify(ncp.ncp);
const asyncReadFile = promisify(readFile);

export default async function (image) {
  // copy image contents, exclude configs
  const fullImgPath = path.resolve(path.dirname(""), "./images");
  await asyncNcp(`${fullImgPath}/${image}/merged`, `tmp`);
  console.log("copied");

  // process config
  const fullConfig = await import("../../images/middle-layer/config.json");
  const config = fullConfig.default[0].Config;
  const splitCommand = config.Cmd;
  // env is key:value pairs
  const environment = config.Env.reduce((acc, curr) => {
    const [key, value] = curr.split("=");
    acc[key] = value;
    return acc;
  }, {});
  const workingDir = config.WorkingDir;

  // set working directory
  // process.chdir(`tmp/${workingDir}`);

  // run command in child
  const startCmd = splitCommand[0];
  splitCommand.shift();
  const childProcess = spawn(startCmd, splitCommand, {
    cwd: `tmp/${workingDir}`,
    env: environment,
  });
  childProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });
  childProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });
  childProcess.on("error", (error) => {
    console.log(`child process error ${error}`);
  });
  childProcess.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
  // remove ref might close open conn, but not sure it will considreing above
  childProcess.unref();
}

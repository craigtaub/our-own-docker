import { unlinkSync } from "fs";
import ncp from "ncp";
import { promisify } from "util";
import { spawn } from "child_process";

const asyncNcp = promisify(ncp.ncp);
const command = process.argv[2];

async function run() {
  switch (command) {
    case "run":
      const image = process.argv[3];
      // copy image contents, exclude configs
      await asyncNcp(`images/${image}/merged`, `tmp`);
      console.log("copied");

      // process config
      const fullConfig = await import("./images/middle-layer/config.json");
      const config = fullConfig.default[0].Config;
      const splitCommand = config.Cmd;
      const workingDir = config.WorkingDir;

      // set working directory
      console.log("workingDir", workingDir);
      process.chdir(`tmp/${workingDir}`);

      // run command in child
      const startCmd = splitCommand[0];
      splitCommand.shift();
      const npm = spawn(startCmd, splitCommand);
      npm.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
      });
      npm.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
      });
      npm.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
      });

      break;
    default:
      break;
  }
}

run();

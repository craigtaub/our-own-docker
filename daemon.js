import express from "express";
import path from "path";
import { spawn } from "child_process";
import { readFile } from "fs";
import { unlinkSync } from "fs";
import ncp from "ncp";
import { promisify } from "util";

const asyncNcp = promisify(ncp.ncp);
const asyncReadFile = promisify(readFile);

const app = express();
const port = 3000;

app.get("/:command/:args", async (req, res) => {
  console.log("Command: ", req.params.command);
  console.log("Args: ", req.params.args);

  switch (req.params.command) {
    case "run":
      const image = req.params.args;
      // copy image contents, exclude configs
      await asyncNcp(`images/${image}/merged`, `tmp`);
      console.log("copied");

      // process config
      const fullConfig = await import("./images/middle-layer/config.json");
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
      childProcess.unref();
      break;
    case "build":
      const buildImage = req.params.args;
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
      break;
  }

  res.send("success");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

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

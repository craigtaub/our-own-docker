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
    case "build":
      const buildImage = req.params.args;
      if (buildImage === ".") {
        // default local image
        const fullPath = path.resolve(path.dirname(""), "./OurDockerfile");
        console.log("fullPath", fullPath);
        const file = await asyncReadFile(fullPath, {
          encoding: "utf-8",
        });
        // good for small files, NOT big ones
        const linesArray = file.split(/\r?\n/);
        linesArray.map((line) => {
          commitLine(line);
        });
      }
      break;
  }
  res.send("success");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

function commitLine(line) {
  //
}

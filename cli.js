import { unlinkSync } from "fs";
import ncp from "ncp";
import { promisify } from "util";
import { spawn } from "child_process";
import fetch from "node-fetch";

const asyncNcp = promisify(ncp.ncp);
const command = process.argv[2];

async function run() {
  let response;
  switch (command) {
    case "build":
      response = await fetch("http://localhost:3000/build/.");
      break;
    case "run":
      const image = process.argv[3];
      response = await fetch(`http://localhost:3000/run/${image}`);
      break;
    default:
      break;
  }
  if (response.status) {
    console.log("SUCCESS");
    return;
  }
  console.log("Failure :(");
}

run();

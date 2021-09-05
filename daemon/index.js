import express from "express";
import path from "path";
import { promisify } from "util";
import run from "./commands/run.js";
import build from "./commands/build.js";

const app = express();
const port = 3000;

app.get("/:command/:args", async (req, res) => {
  console.log("Command: ", req.params.command);
  console.log("Args: ", req.params.args);

  switch (req.params.command) {
    case "run":
      await run(req.params.args);
      break;
    case "build":
      await build(req.params.args);
      break;
  }

  res.send("success");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

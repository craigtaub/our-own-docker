import express from "express";
const app = express();
const port = 3000;

app.get("/:command/:args", (req, res) => {
  console.log("Command: ", req.params.command);
  console.log("Args: ", req.params.args);
  res.send("hey");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

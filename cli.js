import fetch from "node-fetch";

const command = process.argv[2];

async function run() {
  let response;
  switch (command) {
    case "build":
      const imageToBuild = process.argv[3];
      response = await fetch(`http://localhost:3000/build/${imageToBuild}`);
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

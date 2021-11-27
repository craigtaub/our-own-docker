import path from "path";
import utils, {
  asyncNcp,
  asyncReadFile,
  asyncWriteFile,
  asyncCopyFile,
  asyncRimraf,
  asyncMkdir,
  delay,
} from "./utils.js";

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
  },
  cmd: async (values) => {
    const config = await utils.grabConfig();
    config.Config.Cmd = values;
    await utils.updateConfig(config);
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
    const dockerFilePath = path.resolve(path.dirname(""), "./OurDockerfile");
    const file = await asyncReadFile(dockerFilePath, {
      encoding: "utf-8",
    });
    // good for small files, NOT big ones
    const linesArray = file.split(/\r?\n/);
    await linesArray.map(async (line) => await commitLine(line));
    // required for above OS ops to finish
    await delay(1000);
    // create new image
    const layerName = "highest-layer";

    const fullPath = utils.getFullPath();
    // update link (HIGHEST-LAYER) + lower (MIDDLE-ID)
    const link = await asyncReadFile(`${fullPath}/tmp/link`, {
      encoding: "utf-8",
    });
    await asyncWriteFile(`${fullPath}/tmp/link`, layerName.toUpperCase());
    await asyncWriteFile(`${fullPath}/tmp/lower`, link);

    console.log(`SUCCESS - Created layer: ${layerName}`);
    await delay(1000);
    // // move tmp to new image
    await asyncNcp(`${fullPath}/tmp`, `images/${layerName}`);
    // // remove tmp
    await asyncRimraf(`${fullPath}/tmp/`, {});
  }
}

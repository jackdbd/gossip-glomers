import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import * as esbuild from "esbuild";

// https://nodejs.org/api/single-executable-applications.html

const singleExecutableApplication = async ({ solution_filepath }) => {
  const basename = path.basename(solution_filepath).split(".")[0];
  const solutions_root = path.join(solution_filepath, "..", "..");
  const outdir = path.join(solutions_root, "nodejs-sea", basename);
  console.log(
    `create Node.js SEA '${basename}' from ${solution_filepath} in ${outdir}`
  );
  const outfile = path.join(outdir, `${basename}.cjs`);

  console.log(`bundle ${solution_filepath} into ${outfile}`);
  await esbuild.build({
    bundle: true,
    entryPoints: [solution_filepath],
    outfile,
    platform: "node",
  });

  fs.rmSync(path.join(outdir, basename), { force: true });
  fs.rmSync(path.join(outdir, "sea-prep.blob"), { force: true });

  const sea_config = { main: `${basename}.cjs`, output: "sea-prep.blob" };
  const sea_config_filepath = path.join(outdir, "sea-config.json");
  fs.writeFileSync(sea_config_filepath, JSON.stringify(sea_config));

  const commands = [
    `cd ${outdir}`,
    `node --experimental-sea-config sea-config.json`,
    `cp $(command -v node) ${basename}`,
    `chmod 755 ${basename}`,
    `npx postject ${basename} NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
  ];

  console.log(`postinject SEA blob into ${basename}`);
  const buf = execSync(commands.join(" && "));
  console.log(buf.toString());
};

singleExecutableApplication({
  solution_filepath: path.resolve(process.argv.slice(2)[0]),
});

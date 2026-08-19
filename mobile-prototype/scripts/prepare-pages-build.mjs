import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(scriptDirectory, "../../mobile");

async function collectGeneratedFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve(directory, entry.name);
      return entry.isDirectory() ? collectGeneratedFiles(entryPath) : [entryPath];
    }),
  );
  return nestedFiles.flat();
}

const generatedFiles = await collectGeneratedFiles(outputDirectory);
const textAssets = generatedFiles.filter((file) => [".css", ".html", ".js"].includes(extname(file)));

for (const file of textAssets) {
  const source = await readFile(file, "utf8");
  const portableSource = source
    .replaceAll(/(?<!\.)\/assets\//g, "./assets/")
    .replace('<script type="module"', "<script defer");
  if (portableSource !== source) await writeFile(file, portableSource);
}

console.log(`Prepared ${textAssets.length} mobile Pages assets with relative paths.`);

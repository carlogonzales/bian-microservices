import fs from "node:fs";
import path from "node:path";

const APP_ENV = (process.env.APP_ENV || 'dev').toLowerCase();
const DATABASE_PROVIDER = (process.env.DATABASE_PROVIDER || 'sqlite').toLowerCase();

const moduleSchemaDir = path.resolve("prisma/schema");
const outputFile = path.resolve(`prisma/schema.${APP_ENV}.${DATABASE_PROVIDER}.prisma`);

console.log("🛠  Building Prisma schema...");
console.log(` - APP_ENV: ${APP_ENV}`);
console.log(` - DB_PROVIDER: ${DATABASE_PROVIDER}`);

const files = fs
  .readdirSync(moduleSchemaDir)
  .filter(file => file.endsWith(".prisma"))
  // disregard environment-specific schema parts
  .filter(file => !file.includes(".env."))
  // include only relevant environment and db specific schema parts
  .filter((file) => {
    const match = file.match(/\.(.*?)\.(.*?)\.prisma$/);
    return match[1] === DATABASE_PROVIDER && match[2] === APP_ENV;
  })
  .sort(); // ensures deterministic order

const content = files
  .map(file => fs.readFileSync(path.join(moduleSchemaDir, file), "utf8").trim())
  .join("\n\n");

fs.writeFileSync(outputFile, content + "\n");

console.log("✅ Prisma schema built from:");
files.forEach(f => console.log(` - ${f}`));

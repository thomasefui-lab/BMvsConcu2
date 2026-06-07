import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const documents = path.resolve(__dirname, "..", "..");

const SOURCES = {
  bestmobilier: path.join(documents, "bestmobilier-supabase-github", "data"),
  baita: path.join(documents, "baita-supabase-github", "data"),
  sweeek: path.join(documents, "sweeek-supabase-github", "data"),
  habitat: path.join(documents, "habitat-supabase-github", "data"),
  bobochic: path.join(documents, "Codex", "2026-06-06", "je-souhaite-cr-er-un-agent", "data"),
};

function latestCsv(dir, prefix) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".csv"))
    .sort();
  return files.length ? path.join(dir, files.at(-1)) : null;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }
      current += ch;
    }
    values.push(current);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

const products = [];
const events = [];

for (const [site, dir] of Object.entries(SOURCES)) {
  const productFile = latestCsv(dir, "product_snapshots_");
  const eventFile = latestCsv(dir, "daily_events_");
  if (productFile) {
    const rows = parseCsv(readFileSync(productFile, "utf-8"));
    for (const row of rows) {
      products.push({ ...row, site: row.site || site });
    }
  }
  if (eventFile) {
    const rows = parseCsv(readFileSync(eventFile, "utf-8"));
    for (const row of rows) {
      events.push({ ...row, site: row.site || site });
    }
  }
}

const out = path.join(__dirname, "..", "public", "demo-data.json");
writeFileSync(out, JSON.stringify({ products, events }, null, 0));
console.log(`Wrote ${products.length} products and ${events.length} events to ${out}`);

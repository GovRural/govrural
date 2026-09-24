#!/usr/bin/env node
// Tira um screenshot de uma rota do apps/web (dev server precisa estar de
// pe) para analise visual. Uso:
//
//   node screenshot.mjs <path> [opcoes]
//
// Exemplos:
//   node screenshot.mjs /login
//   node screenshot.mjs /dashboard/indicadores --auth
//   node screenshot.mjs /dashboard/produtores --auth --out produtores.png
//
// Opcoes:
//   --out <nome>       nome do arquivo de saida (default: derivado do path)
//   --width <n>         largura do viewport (default 1440)
//   --height <n>        altura do viewport (default 900)
//   --auth              faz login antes de navegar (super admin, seed)
//   --email <email>     credencial para --auth (default $SEED_SUPER_ADMIN_EMAIL)
//   --password <senha>  credencial para --auth (default $SEED_SUPER_ADMIN_PASSWORD)
//   --base-url <url>    default http://localhost:3000
//   --full-page         captura a pagina inteira, nao so o viewport
//   --wait <ms>         espera extra apos o carregamento (default 400)

import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const routePath = args.find((a) => !a.startsWith("--")) ?? "/";

function flag(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return args[idx + 1];
}

function boolFlag(name) {
  return args.includes(`--${name}`);
}

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    const env = {};
    for (const line of text.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
      if (match) env[match[1]] = match[2];
    }
    return env;
  } catch {
    return {};
  }
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const apiEnv = loadEnvFile(join(scriptDir, "..", "..", "apps", "api", ".env"));

const baseUrl = flag("base-url", "http://localhost:3000");
const apiUrl = flag("api-url", apiEnv.API_URL ?? "http://localhost:3001");
const width = Number(flag("width", "1440"));
const height = Number(flag("height", "900"));
const fullPage = boolFlag("full-page");
const waitMs = Number(flag("wait", "400"));
const useAuth = boolFlag("auth");
const email = flag("email", apiEnv.SEED_SUPER_ADMIN_EMAIL ?? "admin@govrural.local");
const password = flag("password", apiEnv.SEED_SUPER_ADMIN_PASSWORD ?? "ChangeMe123!");

const outDir = join(scriptDir, "screenshots");
mkdirSync(outDir, { recursive: true });
const defaultName = routePath.replace(/^\//, "").replace(/\//g, "_") || "home";
const outName = flag("out", `${defaultName}.png`);
const outPath = isAbsolute(outName) ? outName : join(outDir, outName);

// O binario do Chromium do Playwright nao pode ser baixado neste ambiente
// (download bloqueado pela rede/sandbox) - usamos o Microsoft Edge que ja
// vem instalado no Windows (mesmo motor Chromium, canal "msedge").
const browser = await chromium.launch({ channel: "msedge" });
try {
  const page = await browser.newPage({ viewport: { width, height } });

  if (useAuth) {
    // networkidle + espera extra: preencher antes da hidratacao do React
    // terminar faz o valor ser sobrescrito de volta para vazio.
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|portal)/, { timeout: 15000 });
  }

  await page.goto(`${baseUrl}${routePath}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: outPath, fullPage });

  console.log(`Screenshot salvo em: ${outPath}`);
} finally {
  await browser.close();
}

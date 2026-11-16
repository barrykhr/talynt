// Start the tool and give it a temporary public https link (Cloudflare quick tunnel).
// The link works only while this window is open and your Mac is awake.
import "dotenv/config";
import fs from "fs";
import { spawn } from "child_process";
import { bin, install } from "cloudflared";

if (!process.env.APP_PASSWORD || process.env.APP_PASSWORD.length < 8) {
  console.error("\nSet a team password first: add a line like  APP_PASSWORD=some-long-password  to .env");
  console.error("(at least 8 characters). Without it, anyone with the link could use your OpenAI credit.\n");
  process.exit(1);
}

await import("./server.js");

if (!fs.existsSync(bin)) {
  console.log("Downloading the Cloudflare tunnel tool (one time)...");
  await install(bin);
}

const port = Number(process.env.PORT || 3030);
const tunnel = spawn(bin, ["tunnel", "--no-autoupdate", "--protocol", "http2", "--url", `http://localhost:${port}`]);
let shown = false;
const watch = (chunk) => {
  const m = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (m && !shown) {
    shown = true;
    console.log("\n==============================================");
    console.log(" Share this link with your team:");
    console.log(` ${m[0]}`);
    console.log(" Login: any username + the APP_PASSWORD from .env");
    console.log(" Works only while this window stays open.");
    console.log("==============================================\n");
  }
};
tunnel.stdout.on("data", watch);
tunnel.stderr.on("data", watch);
tunnel.on("exit", (code) => {
  console.error(`Tunnel stopped (code ${code}). Run npm run share again to get a new link.`);
  process.exit(1);
});
process.on("SIGINT", () => { tunnel.kill(); process.exit(0); });

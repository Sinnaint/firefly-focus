/*
 * Builds desktop/out/desktop-icons.exe from helper/desktop-icons.cs, when it is
 * missing or older than its source. The compiler comes with Windows, as part of the
 * .NET Framework, so the project needs no further tools for this.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DESKTOP = path.join(__dirname, "..");
const SOURCE = path.join(DESKTOP, "helper", "desktop-icons.cs");
const OUTPUT = path.join(DESKTOP, "out", "desktop-icons.exe");
const COMPILER = path.join(process.env.WINDIR || "C:\\Windows", "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe");

function upToDate() {
  return fs.existsSync(OUTPUT) && fs.statSync(OUTPUT).mtimeMs >= fs.statSync(SOURCE).mtimeMs;
}

if (!upToDate()) {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  execFileSync(COMPILER, ["/nologo", "/optimize", "/target:winexe", "/r:System.Drawing.dll", `/out:${OUTPUT}`, SOURCE], { stdio: "inherit" });
  console.log(`built ${OUTPUT}`);
}

/*
 * Builds the package for the Microsoft Store: npm run dist
 *
 * The program runs the extension's files from the repository's root, so they are
 * first gathered, with desktop/ beside them as during development, into a folder of
 * exactly what the program needs. Nothing else gets into the package: not the tests,
 * tools and notes, and not the app or extension files the program has no use for.
 *
 * The Store gives a program its identity when its name is reserved in Partner
 * Center. Those three values go into store-identity.json before the real build.
 */
const fs = require("fs");
const path = require("path");
const { build, Platform, Arch } = require("electron-builder");

const DESKTOP = path.join(__dirname, "..");
const ROOT = path.join(DESKTOP, "..");
const STAGE = path.join(DESKTOP, "out", "stage");
const OUTPUT = path.join(DESKTOP, "dist");
const own = JSON.parse(fs.readFileSync(path.join(DESKTOP, "package.json"), "utf8"));
const identity = JSON.parse(fs.readFileSync(path.join(DESKTOP, "store-identity.json"), "utf8"));

// A new file the program loads has to be added here, or it will be missing only
// in the packaged program.
const FILES = [
  "LICENSE",
  "icon128.png",
  "icon32.png",
  "sidepanel.html",
  "sidepanel.css",
  "sidepanel.js",
  "fullscreen.html",
  "fullscreen.css",
  "fullscreen.js",
  "shared.js",
  "buddy.js",
  "floating_widget.js",
  "service_worker.js",
  "offscreen.js",
  "app/app.css",
  "desktop/main.js",
  "desktop/preload.js",
  "desktop/shim.js",
  "desktop/words.js",
  "desktop/engine.html",
  "desktop/engine.js",
  "desktop/overlay.html",
  "desktop/overlay.js",
  "desktop/launcher.html",
  "desktop/launcher.js",
  "desktop/panel.js",
  "desktop/panel.css",
  "desktop/quick_timer.js",
];

function gather() {
  fs.rmSync(STAGE, { recursive: true, force: true });
  for (const file of FILES) {
    const to = path.join(STAGE, file);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(ROOT, file), to);
  }
  fs.writeFileSync(path.join(STAGE, "package.json"), JSON.stringify({
    name: "firefly-focus",
    productName: "Firefly Focus",
    version: own.version,
    description: "A calm focus timer with tasks and a cat that stays over your other programs.",
    main: "desktop/main.js",
    author: identity.publisherDisplayName,
    license: "MIT",
  }, null, 2));
}

async function main() {
  gather();
  const files = await build({
    projectDir: DESKTOP,
    targets: Platform.WINDOWS.createTarget(["appx"], Arch.x64),
    config: {
      appId: "com.sinnaint.fireflyfocus",
      productName: "Firefly Focus",
      copyright: `Copyright © 2026 ${identity.publisherDisplayName}`,
      artifactName: "FireflyFocus-${version}-${arch}.${ext}",
      directories: {
        app: STAGE,
        output: OUTPUT,
        buildResources: path.join(DESKTOP, "build"),
      },
      electronDist: path.join(DESKTOP, "node_modules", "electron", "dist"),
      electronVersion: require(path.join(DESKTOP, "node_modules", "electron", "package.json")).version,
      npmRebuild: false,
      nodeGypRebuild: false,
      // The languages the program speaks, and no others: each costs several megabytes.
      electronLanguages: ["en-US", "uk", "de", "es", "it", "sk", "cs"],
      win: { icon: path.join(ROOT, "assets", "logo", "icon-512.png") },
      appx: {
        ...identity,
        applicationId: "FireflyFocus",
        displayName: "Firefly Focus",
        backgroundColor: "#210635",
        languages: ["en-US", "uk-UA", "de-DE", "es-ES", "it-IT", "sk-SK", "cs-CZ"],
        minVersion: "10.0.19041.0",
        maxVersionTested: "10.0.26100.0",
      },
    },
  });
  console.log(files.filter((file) => !file.endsWith(".blockmap")).join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

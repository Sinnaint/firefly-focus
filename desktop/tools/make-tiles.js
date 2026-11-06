/*
 * Draws the tiles and icons a Windows package needs from the project's logo, into
 * desktop/build/appx. Run it when the logo changes: npm run tiles
 *
 * Sizes follow what Windows asks of a package: the plain size and double for
 * scaled screens, and for the small icon also exact sizes, with "unplated" ones for
 * the taskbar and Start, where the icon stands without a coloured plate behind it.
 */
const { app, nativeImage } = require("electron");
const fs = require("fs");
const path = require("path");

const LOGO = path.join(__dirname, "..", "..", "assets", "logo", "icon-512.png");
const OUT = path.join(__dirname, "..", "build", "appx");

// The square logo at this share of the canvas, centred, on a transparent ground.
function canvas(logo, width, height, share) {
  const side = Math.round(Math.min(width, height) * share);
  const icon = logo.resize({ width: side, height: side, quality: "best" }).toBitmap();
  const pixels = Buffer.alloc(width * height * 4);
  const left = Math.floor((width - side) / 2);
  const top = Math.floor((height - side) / 2);
  for (let row = 0; row < side; row += 1) {
    icon.copy(pixels, ((top + row) * width + left) * 4, row * side * 4, (row + 1) * side * 4);
  }
  return nativeImage.createFromBitmap(pixels, { width, height });
}

function write(name, image) {
  fs.writeFileSync(path.join(OUT, `${name}.png`), image.toPNG());
}

app.whenReady().then(() => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const logo = nativeImage.createFromPath(LOGO);
  if (logo.isEmpty()) throw new Error(`cannot read ${LOGO}`);

  for (const [name, width, height, share] of [
    ["StoreLogo", 50, 50, 1],
    ["Square44x44Logo", 44, 44, 1],
    ["Square150x150Logo", 150, 150, 0.66],
    ["Wide310x150Logo", 310, 150, 0.66],
    ["SmallTile", 71, 71, 0.72],
    ["LargeTile", 310, 310, 0.66],
  ]) {
    write(`${name}.scale-100`, canvas(logo, width, height, share));
    write(`${name}.scale-200`, canvas(logo, width * 2, height * 2, share));
  }

  for (const size of [16, 24, 32, 48, 256]) {
    const icon = logo.resize({ width: size, height: size, quality: "best" });
    write(`Square44x44Logo.targetsize-${size}`, icon);
    write(`Square44x44Logo.targetsize-${size}_altform-unplated`, icon);
  }

  // Not in the package: the icon to upload for the Store listing.
  const store = path.join(__dirname, "..", "build", "store");
  fs.mkdirSync(store, { recursive: true });
  fs.writeFileSync(path.join(store, "AppTile-300x300.png"), logo.resize({ width: 300, height: 300, quality: "best" }).toPNG());

  console.log(`${fs.readdirSync(OUT).length} files in ${OUT}`);
  app.exit(0);
}).catch((error) => {
  console.error(error);
  app.exit(1);
});

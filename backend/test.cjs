// backend/compile-node.cjs
const tf = require("@tensorflow/tfjs-node"); // 1) register 'tensorflow' backend
const { JSDOM } = require("jsdom");
const { createCanvas, Image } = require("canvas");
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

// 2) Force TFJS to use the 'tensorflow' backend
(async () => {
  await tf.setBackend("tensorflow");
  await tf.ready();
  // Optional sanity check:
  // console.log('TF backend:', tf.getBackend()); // -> 'tensorflow'

  // 3) Minimal browser-y globals MindAR expects
  const { window } = new JSDOM("<!doctype html><html><body></body></html>");
  global.window = window; // MindAR attaches to window.MINDAR
  global.document = window.document;
  global.self = global;
  global.navigator = { userAgent: "node" };
  global.HTMLCanvasElement = createCanvas(1, 1).constructor;
  global.Image = Image;

  // 4) Load MindAR (attaches to window.MINDAR)
  require("mind-ar/dist/mindar-image.prod.js");

  const Compiler = window?.MINDAR?.IMAGE?.Compiler || window?.MINDAR?.Compiler;
  if (typeof Compiler !== "function") {
    throw new Error("MindAR Compiler not found after loading bundle.");
  }

  // 5) Helper to turn a file into an Image()
  function fileToImage(absPath) {
    return new Promise((resolve, reject) => {
      const buf = readFileSync(absPath);
      const mime = /\.jpe?g$/i.test(absPath) ? "image/jpeg" : "image/png";
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `data:${mime};base64,${buf.toString("base64")}`;
    });
  }

  // 6) Compile ~/Desktop/alf.png → ./targets.mind
  const inputPath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    "Desktop",
    "alf.jpg"
  );

  const img = await fileToImage(inputPath);

  const compiler = new Compiler();
  await compiler.compileImageTargets([img], (p) =>
    process.stdout.write(`\rCompiling… ${Math.round(p * 100)}%`)
  );
  const arrBuf = await compiler.exportData();
  writeFileSync("./targets.mind", Buffer.from(arrBuf));
  process.stdout.write(`\nWrote ./targets.mind\n`);
})().catch((err) => {
  console.error("\nCompile failed:", err);
  process.exit(1);
});

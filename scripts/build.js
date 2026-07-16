"use strict";

var fs = require("node:fs");
var path = require("node:path");

var root = path.resolve(__dirname, "..");
var destination = path.join(root, "dist");
var sources = [
  "index.html",
  "chapter2.html",
  "css",
  "js",
  "images",
];

function copySource(relativePath) {
  var source = path.join(root, relativePath);
  var target = path.join(destination, relativePath);
  fs.cpSync(source, target, { recursive: true });
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
sources.forEach(copySource);
fs.writeFileSync(path.join(destination, ".nojekyll"), "", "utf8");

console.log("build: OK (static files copied to dist)");

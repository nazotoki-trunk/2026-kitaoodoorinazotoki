"use strict";

var assert = require("node:assert/strict");
var fs = require("node:fs");
var path = require("node:path");
var vm = require("node:vm");

var root = path.resolve(__dirname, "..");
var source = fs.readFileSync(path.join(root, "js/hints-data.js"), "utf8");
var context = {};

vm.createContext(context);
vm.runInContext(source + "\nthis.__SITE_DATA__ = SITE_DATA;", context);

var data = context.__SITE_DATA__;
var assetTokenPattern = /\[\[asset:([a-z0-9-]+)\]\]/g;

function collectPuzzles(block) {
  if (block.kind === "group") return block.puzzles || [];
  return [block];
}

function collectAssetTokens(text) {
  var tokens = [];
  var match;
  assetTokenPattern.lastIndex = 0;
  while ((match = assetTokenPattern.exec(String(text || ""))) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
}

assert.equal(data.pages.length, 2, "第一章と第二章・最終章の2ページであること");
assert.deepEqual(
  Array.from(data.pages, function (page) { return page.id; }),
  ["chapter1", "chapter2-final"],
  "ページIDがHTMLのdata-pageと一致すること"
);

var ids = new Set();
var referencedAssets = new Set();
var puzzleCount = 0;

data.pages.forEach(function (page) {
  assert.ok(page.navigation && page.navigation.href, page.id + "に章移動リンクがあること");
  assert.ok(page.blocks.length > 0, page.id + "にヒント項目があること");

  page.blocks.forEach(function (block) {
    assert.ok(!ids.has(block.id), "IDが重複していないこと: " + block.id);
    ids.add(block.id);
    if (block.icon) referencedAssets.add(block.icon);

    collectPuzzles(block).forEach(function (puzzle) {
      puzzleCount += 1;
      if (puzzle !== block) {
        assert.ok(!ids.has(puzzle.id), "IDが重複していないこと: " + puzzle.id);
        ids.add(puzzle.id);
      }
      assert.ok(Array.isArray(puzzle.hints) && puzzle.hints.length > 0, puzzle.id + "にヒントがあること");
      assert.ok(puzzle.answer, puzzle.id + "に答えがあること");
      assert.notEqual(puzzle.answer, "-", puzzle.id + "の答えが未入力でないこと");
      if (puzzle.icon) referencedAssets.add(puzzle.icon);

      puzzle.hints.concat([puzzle.answer]).forEach(function (text) {
        collectAssetTokens(text).forEach(function (assetKey) {
          referencedAssets.add(assetKey);
        });
      });
    });
  });
});

referencedAssets.forEach(function (assetKey) {
  assert.ok(data.assets[assetKey], "参照画像がassetsに定義されていること: " + assetKey);
  assert.match(data.assets[assetKey].src, /^images\/icons\/[a-z0-9-]+\.png$/);
});

assert.equal(puzzleCount, 29, "スプレッドシート上の29個の謎・回答を収録していること");
assert.equal(data.pages[0].blocks[data.pages[0].blocks.length - 1].answer, "くじら");
assert.equal(data.pages[1].blocks[data.pages[1].blocks.length - 1].puzzles.slice(-1)[0].answer, "きつつき");

console.log("site-data: OK (" + puzzleCount + " puzzles, " + referencedAssets.size + " assets)");

"use strict";

var assert = require("node:assert/strict");
var fs = require("node:fs");
var path = require("node:path");
var JSDOM = require("jsdom").JSDOM;

var root = path.resolve(__dirname, "..");
var dataSource = fs.readFileSync(path.join(root, "js/hints-data.js"), "utf8");
var appSource = fs.readFileSync(path.join(root, "js/app.js"), "utf8");

function renderPage(filename) {
  var html = fs.readFileSync(path.join(root, filename), "utf8");
  var dom = new JSDOM(html, {
    runScripts: "outside-only",
    url: "https://example.test/" + filename,
  });

  dom.window.eval(dataSource);
  dom.window.eval(appSource);
  return dom;
}

function directButton(document, id) {
  return document.querySelector("#" + id + " > .disclosure-button");
}

function assertNestedPuzzle(document, groupId, puzzleId) {
  var panel = document.querySelector("#" + groupId + " > .disclosure-panel");
  assert.ok(panel.querySelector(":scope > #" + puzzleId), puzzleId + "が" + groupId + "の中にあること");
  assert.equal(document.querySelector(".story-list > #" + puzzleId), null, puzzleId + "が最上位にないこと");
}

var chapter1 = renderPage("index.html");
var chapter1Document = chapter1.window.document;

assert.equal(chapter1Document.querySelector(".page-title").textContent, "第一章");
assert.equal(chapter1Document.querySelectorAll(".story-list > .story-block").length, 4);
assert.equal(chapter1Document.querySelector(".page-navigation-link").getAttribute("href"), "chapter2.html");
assertNestedPuzzle(chapter1Document, "chapter1-kasa", "chapter1-star1");
assertNestedPuzzle(chapter1Document, "chapter1-kikyu", "chapter1-star2");
assertNestedPuzzle(chapter1Document, "chapter1-ringo", "chapter1-star3");
assert.ok(chapter1Document.querySelectorAll(".asset-placeholder").length > 0, "未配置画像にはプレースホルダーを表示すること");

var kasaButton = directButton(chapter1Document, "chapter1-kasa");
var kasaPanel = chapter1Document.querySelector("#chapter1-kasa > .disclosure-panel");
assert.equal(kasaButton.getAttribute("aria-expanded"), "false");
assert.equal(kasaPanel.hidden, true);

kasaButton.click();
assert.equal(kasaButton.getAttribute("aria-expanded"), "true");
assert.equal(kasaPanel.hidden, false);
assert.equal(kasaPanel.querySelectorAll(":scope > .nested-puzzle").length, 4);

var dice1 = chapter1Document.getElementById("chapter1-kasa-dice1");
var dice1Button = dice1.querySelector(":scope > .disclosure-button");
var dice1Panel = dice1.querySelector(":scope > .disclosure-panel");
dice1Button.click();
assert.equal(dice1Panel.hidden, false);
assert.equal(dice1Panel.querySelectorAll(".hint-reveal").length, 2);

var firstHintButton = dice1Panel.querySelector(".hint-reveal > .disclosure-button");
var firstHintPanel = dice1Panel.querySelector(".hint-reveal > .disclosure-panel");
firstHintButton.click();
assert.equal(firstHintPanel.hidden, false);
assert.match(firstHintPanel.textContent, /上の方も探してみよう/);

var answerButton = dice1Panel.querySelector(".answer-reveal > .disclosure-button");
var answerPanel = dice1Panel.querySelector(".answer-reveal > .disclosure-panel");
answerButton.click();
assert.equal(answerButton.getAttribute("aria-expanded"), "false", "答えは1回目では開かないこと");
assert.equal(answerButton.classList.contains("is-confirming"), true);
answerButton.click();
assert.equal(answerButton.getAttribute("aria-expanded"), "true", "答えは2回目で開くこと");
assert.equal(answerPanel.hidden, false);
assert.match(answerPanel.textContent, /さんぽ/);

var chapter2 = renderPage("chapter2.html");
var chapter2Document = chapter2.window.document;

assert.equal(chapter2Document.querySelector(".page-title").textContent, "第二章・最終章");
assert.equal(chapter2Document.querySelectorAll(".story-list > .story-block").length, 5);
assert.equal(chapter2Document.querySelector(".page-navigation-link").getAttribute("href"), "index.html");
assertNestedPuzzle(chapter2Document, "chapter2-jitensha", "chapter2-star1");
assertNestedPuzzle(chapter2Document, "chapter2-usagi", "chapter2-star2");
assertNestedPuzzle(chapter2Document, "chapter2-ie", "chapter2-star3");

var finalButton = directButton(chapter2Document, "final-chapter");
var finalPanel = chapter2Document.querySelector("#final-chapter > .disclosure-panel");
finalButton.click();
assert.equal(finalPanel.hidden, false);
assert.equal(finalPanel.querySelectorAll(":scope > .nested-puzzle").length, 5);
assert.match(finalPanel.textContent, /LAST ANSWER/);

chapter1.window.close();
chapter2.window.close();

console.log("app: OK (two pages, nested hints, guarded answers, navigation)");

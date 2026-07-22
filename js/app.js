/* =========================================================================
 * 北大通謎解きさんぽ2026 ヒントページ描画
 *
 * 文言と画像パスは hints-data.js に集約しています。
 * UI生成、アコーディオン制御、画像フォールバックをこのファイルが担当します。
 * ====================================================================== */

(function () {
  "use strict";

  var app = document.getElementById("app");
  var pageId = document.body.getAttribute("data-page");
  var disclosureSerial = 0;

  function createElement(tagName, className, text) {
    var node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function findPage(data, targetPageId) {
    return (data.pages || []).find(function (page) {
      return page.id === targetPageId;
    });
  }

  function getAsset(data, assetKey) {
    return data.assets && data.assets[assetKey] ? data.assets[assetKey] : {
      src: "",
      alt: assetKey,
      label: assetKey,
    };
  }

  function showLoadedAsset(image, placeholder) {
    image.hidden = false;
    placeholder.hidden = true;
  }

  function keepAssetPlaceholder(image, placeholder) {
    image.hidden = true;
    placeholder.hidden = false;
  }

  function buildAsset(data, assetKey, variant) {
    var asset = getAsset(data, assetKey);
    var wrapper = createElement("span", "asset asset--" + variant);
    var image = document.createElement("img");
    var placeholder = createElement("span", "asset-placeholder");
    var label = createElement("span", "asset-placeholder-label", asset.label + "画像");

    image.src = asset.src;
    image.alt = asset.alt;
    image.hidden = true;

    placeholder.appendChild(label);
    if (variant !== "inline") {
      placeholder.appendChild(createElement("span", "asset-placeholder-path", asset.src));
    }

    wrapper.title = "画像を置く場所: " + asset.src;
    image.addEventListener("load", function () {
      showLoadedAsset(image, placeholder);
    });
    image.addEventListener("error", function () {
      keepAssetPlaceholder(image, placeholder);
    });

    wrapper.appendChild(image);
    wrapper.appendChild(placeholder);
    return wrapper;
  }

  function appendRichText(target, data, text) {
    var source = String(text || "");
    var tokenPattern = /\[\[asset:([a-z0-9-]+)\]\]/g;
    var cursor = 0;
    var match;

    while ((match = tokenPattern.exec(source)) !== null) {
      if (match.index > cursor) {
        target.appendChild(document.createTextNode(source.slice(cursor, match.index)));
      }
      target.appendChild(buildAsset(data, match[1], "inline"));
      cursor = tokenPattern.lastIndex;
    }

    if (cursor < source.length) {
      target.appendChild(document.createTextNode(source.slice(cursor)));
    }
  }

  function setDisclosureState(shell, opened) {
    shell.root.classList.toggle("is-open", opened);
    shell.button.classList.toggle("is-open", opened);
    shell.button.setAttribute("aria-expanded", String(opened));
    shell.panel.hidden = !opened;
    shell.chevron.textContent = opened ? "−" : "+";
  }

  function enableStandardDisclosure(shell) {
    shell.button.addEventListener("click", function () {
      setDisclosureState(shell, !shell.root.classList.contains("is-open"));
    });
  }

  function createDisclosure(title, className, iconNode) {
    disclosureSerial += 1;

    var root = createElement("section", "disclosure " + className);
    var button = createElement("button", "disclosure-button");
    var titleNode = createElement("span", "disclosure-title", title);
    var chevron = createElement("span", "disclosure-chevron", "+");
    var panel = createElement("div", "disclosure-panel");
    var panelId = "disclosure-panel-" + disclosureSerial;

    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panelId);
    panel.id = panelId;
    panel.hidden = true;

    if (iconNode) button.appendChild(iconNode);
    button.appendChild(titleNode);
    button.appendChild(chevron);

    var shell = {
      root: root,
      button: button,
      panel: panel,
      chevron: chevron,
    };

    root.appendChild(button);
    root.appendChild(panel);
    return shell;
  }

  function buildHintReveal(data, hint, hintNumber) {
    var shell = createDisclosure("ヒント" + hintNumber, "hint-reveal", null);
    var text = createElement("p", "hint-text");
    appendRichText(text, data, hint);
    shell.panel.appendChild(text);
    enableStandardDisclosure(shell);
    return shell.root;
  }

  function buildAnswerReveal(data, answer) {
    var shell = createDisclosure("答え", "answer-reveal", null);
    var text = createElement("p", "answer-text");
    var confirming = false;

    appendRichText(text, data, answer);
    shell.panel.appendChild(text);

    shell.button.addEventListener("click", function () {
      var opened = shell.root.classList.contains("is-open");

      if (!opened && !confirming) {
        confirming = true;
        shell.button.classList.add("is-confirming");
        shell.button.querySelector(".disclosure-title").textContent = "もう一度押して答えを表示";
        return;
      }

      confirming = false;
      shell.button.classList.remove("is-confirming");
      shell.button.querySelector(".disclosure-title").textContent = "答え";
      setDisclosureState(shell, !opened);
    });

    return shell.root;
  }

  function buildPuzzleContents(data, puzzle) {
    var fragment = document.createDocumentFragment();

    (puzzle.hints || []).forEach(function (hint, index) {
      fragment.appendChild(buildHintReveal(data, hint, index + 1));
    });

    if (puzzle.answer) {
      fragment.appendChild(buildAnswerReveal(data, puzzle.answer));
    }

    return fragment;
  }

  function buildNestedPuzzle(data, puzzle) {
    var icon = puzzle.icon ? buildAsset(data, puzzle.icon, "small") : null;
    var shell = createDisclosure(puzzle.title, "nested-puzzle", icon);
    shell.root.id = puzzle.id;
    shell.panel.appendChild(buildPuzzleContents(data, puzzle));
    enableStandardDisclosure(shell);
    return shell.root;
  }

  function buildPuzzleGroup(data, block) {
    var icon = block.icon ? buildAsset(data, block.icon, "large") : null;
    var shell = createDisclosure(block.title, "story-block story-group", icon);
    shell.root.id = block.id;

    (block.puzzles || []).forEach(function (puzzle) {
      shell.panel.appendChild(buildNestedPuzzle(data, puzzle));
    });

    enableStandardDisclosure(shell);
    return shell.root;
  }

  function buildStandalonePuzzle(data, block) {
    var icon = block.icon ? buildAsset(data, block.icon, "large") : null;
    var shell = createDisclosure(block.title, "story-block story-puzzle", icon);
    shell.root.id = block.id;
    shell.panel.appendChild(buildPuzzleContents(data, block));
    enableStandardDisclosure(shell);
    return shell.root;
  }

  function buildStoryAnswer(data, block) {
    var shell = createDisclosure(block.title, "story-block story-answer", null);
    shell.root.id = block.id;
    shell.panel.appendChild(buildPuzzleContents(data, block));
    enableStandardDisclosure(shell);
    return shell.root;
  }

  function buildBlock(data, block) {
    if (block.kind === "group") return buildPuzzleGroup(data, block);
    if (block.kind === "answer") return buildStoryAnswer(data, block);
    return buildStandalonePuzzle(data, block);
  }

  function buildPageNavigation(page, location) {
    var nav = createElement("nav", "page-navigation page-navigation--" + location);
    var link = createElement("a", "page-navigation-link", page.navigation.label);
    link.href = page.navigation.href;
    link.appendChild(createElement("span", "page-navigation-arrow", "→"));
    nav.setAttribute("aria-label", "章の移動");
    nav.appendChild(link);
    return nav;
  }

  function buildHeader(data, page) {
    var header = createElement("header", "site-header");
    var eyebrow = createElement("p", "site-eyebrow", "北大通謎解きさんぽ 2026");
    var title = createElement("h1", "site-title", data.title);
    var pageTitle = createElement("p", "page-title", page.title);
    var lead = createElement("p", "site-lead", page.lead);

    header.appendChild(eyebrow);
    header.appendChild(title);
    header.appendChild(pageTitle);
    header.appendChild(lead);
    return header;
  }

  function buildNotice(data) {
    var aside = createElement("aside", "notice");
    var heading = createElement("h2", "notice-title", "ヒントを見る前に");
    var list = createElement("ul", "notice-list");

    (data.notice || []).forEach(function (line) {
      list.appendChild(createElement("li", null, line));
    });

    aside.appendChild(heading);
    aside.appendChild(list);
    return aside;
  }

  function render(data, page) {
    document.title = page.title + "｜" + data.title + data.subtitle;
    app.textContent = "";
    app.appendChild(buildHeader(data, page));
    app.appendChild(buildPageNavigation(page, "top"));
    app.appendChild(buildNotice(data));

    var content = createElement("div", "story-list");
    (page.blocks || []).forEach(function (block) {
      content.appendChild(buildBlock(data, block));
    });
    app.appendChild(content);
    app.appendChild(buildPageNavigation(page, "bottom"));
    app.appendChild(createElement("footer", "site-footer", data.footer));
  }

  function renderError(message) {
    app.textContent = "";
    app.appendChild(createElement("p", "noscript", message));
  }

  function setupToTop() {
    var button = document.getElementById("to-top");
    if (!button) return;

    window.addEventListener("scroll", function () {
      button.classList.toggle("is-visible", window.scrollY > 480);
    }, { passive: true });

    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (!window.SITE_DATA) {
    renderError("ヒントデータを読み込めませんでした。時間をおいて再度お試しください。");
    return;
  }

  var page = findPage(window.SITE_DATA, pageId);
  if (!page) {
    renderError("指定された章のヒントページが見つかりませんでした。");
    return;
  }

  render(window.SITE_DATA, page);
  setupToTop();
})();

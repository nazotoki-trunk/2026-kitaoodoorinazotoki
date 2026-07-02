/* =========================================================================
 * 謎解きヒントサイト 描画スクリプト
 * js/hints-data.js の SITE_DATA を読み込んでページを組み立てます。
 * 文言の変更はこのファイルではなく hints-data.js で行ってください。
 * ======================================================================== */

(function () {
  "use strict";

  var app = document.getElementById("app");

  /* ---------- 小さなヘルパー ---------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  /* ヒント・答えの中身（文字列 or {text, image}）を本文要素にする */
  function buildBody(content) {
    var body = el("div", "reveal-body");
    if (typeof content === "string") {
      body.appendChild(document.createTextNode(content));
    } else if (content && typeof content === "object") {
      if (content.text) body.appendChild(document.createTextNode(content.text));
      if (content.image) {
        var img = document.createElement("img");
        img.src = content.image;
        img.alt = "";
        img.loading = "lazy";
        body.appendChild(img);
      }
    }
    return body;
  }

  /*
   * タップで開閉するブロックを作る。
   * isAnswer=true の場合は誤タップ防止のため、
   * 1回目のタップで「もう一度タップで表示」に変わり、2回目で開く。
   */
  function buildReveal(label, content, isAnswer, extraNode) {
    var wrap = el("div", "reveal" + (isAnswer ? " reveal--answer" : ""));
    var button = el("button", "reveal-button");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");

    var labelSpan = el("span", null, label + "を見る");
    var chevron = el("span", "chevron", "▼");
    button.appendChild(labelSpan);
    button.appendChild(chevron);

    var body = buildBody(content);
    if (extraNode) body.appendChild(extraNode);

    var confirming = false;

    button.addEventListener("click", function () {
      var isOpen = wrap.classList.contains("is-open");

      if (!isOpen && isAnswer && !confirming) {
        confirming = true;
        button.classList.add("is-confirming");
        labelSpan.textContent = "もう一度タップで" + label + "を表示";
        return;
      }

      confirming = false;
      button.classList.remove("is-confirming");
      wrap.classList.toggle("is-open");

      var opened = wrap.classList.contains("is-open");
      button.classList.toggle("is-open", opened);
      button.setAttribute("aria-expanded", String(opened));
      labelSpan.textContent = opened ? label + "を閉じる" : label + "を見る";
      chevron.textContent = opened ? "▲" : "▼";
    });

    wrap.appendChild(button);
    wrap.appendChild(body);
    return wrap;
  }

  /* ---------- ページ構築 ---------- */

  function render(data) {
    document.title = data.title + " " + (data.subtitle || "ヒントページ");

    /* ヘッダー */
    var header = el("header", "site-header");
    header.appendChild(el("h1", "site-title", data.title));
    if (data.subtitle) header.appendChild(el("p", "site-subtitle", data.subtitle));
    app.appendChild(header);

    /* 注意書き */
    if (data.notice && data.notice.length) {
      var notice = el("div", "notice");
      var ul = el("ul");
      data.notice.forEach(function (line) {
        ul.appendChild(el("li", null, line));
      });
      notice.appendChild(ul);
      app.appendChild(notice);
    }

    var chapters = data.chapters || [];
    var multiChapter = chapters.length > 1;

    /* 目次 */
    var toc = el("nav", "toc");
    chapters.forEach(function (chapter) {
      if (multiChapter && chapter.title) {
        toc.appendChild(el("p", "toc-chapter-title", chapter.title));
      }
      var list = el("ul", "toc-list");
      (chapter.puzzles || []).forEach(function (puzzle) {
        var li = el("li");
        var a = el("a", null, puzzle.title);
        a.href = "#puzzle-" + puzzle.id;
        li.appendChild(a);
        list.appendChild(li);
      });
      toc.appendChild(list);
    });
    app.appendChild(toc);

    /* 章と謎 */
    chapters.forEach(function (chapter) {
      var section = el("section", "chapter");
      section.id = "chapter-" + chapter.id;

      if (multiChapter && chapter.title) {
        section.appendChild(el("h2", "chapter-title", chapter.title));
      }

      (chapter.puzzles || []).forEach(function (puzzle) {
        var card = el("article", "puzzle");
        card.id = "puzzle-" + puzzle.id;

        card.appendChild(el("h3", "puzzle-title", puzzle.title));
        if (puzzle.description) {
          card.appendChild(el("p", "puzzle-description", puzzle.description));
        }

        (puzzle.hints || []).forEach(function (hint, i) {
          card.appendChild(buildReveal("ヒント" + (i + 1), hint, false));
        });

        if (puzzle.answer) {
          var note = null;
          if (puzzle.answerNote) {
            note = el("div", "answer-note", puzzle.answerNote);
          }
          card.appendChild(buildReveal("答え", puzzle.answer, true, note));
        }

        /* ページ上部へ戻るリンク */
        var back = el("p", "back-links");
        var topLink = el("a", null, "ページの上へ");
        topLink.href = "#";
        topLink.addEventListener("click", function (e) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        back.appendChild(topLink);
        card.appendChild(back);

        section.appendChild(card);
      });

      app.appendChild(section);
    });

    /* フッター */
    if (data.footer) {
      app.appendChild(el("footer", "site-footer", data.footer));
    }
  }

  /* ---------- ページ上へ戻るボタン ---------- */

  function setupToTop() {
    var button = document.getElementById("to-top");
    if (!button) return;

    window.addEventListener("scroll", function () {
      button.classList.toggle("is-visible", window.scrollY > 400);
    }, { passive: true });

    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (typeof SITE_DATA !== "undefined") {
    render(SITE_DATA);
    setupToTop();
  } else {
    app.appendChild(el("p", "noscript", "データファイル（js/hints-data.js）が読み込めませんでした。"));
  }
})();

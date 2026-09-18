const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { initialize } = require("../src/index.user.js");

const SOURCE = fs.readFileSync(
  path.join(__dirname, "..", "src", "index.user.js"),
  "utf8",
);
const COUNT_SELECTOR = "[data-bangumi-friends-count]";

class Element {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toLowerCase();
    this.ownerDocument = ownerDocument;
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
  }

  get className() {
    return this.getAttribute("class") ?? "";
  }

  set className(value) {
    this.setAttribute("class", value);
  }

  get textContent() {
    return this.children
      .map((child) =>
        typeof child === "string" ? child : child.textContent,
      )
      .join("");
  }

  set textContent(value) {
    this.children = [String(value)];
  }

  append(...nodes) {
    for (const node of nodes) {
      if (node?.parentElement) {
        const index = node.parentElement.children.indexOf(node);
        if (index !== -1) node.parentElement.children.splice(index, 1);
      }
      this.children.push(node);
      if (typeof node !== "string") {
        node.parentElement = this;
        node.ownerDocument ??= this.ownerDocument;
      }
    }
  }

  remove() {
    const index = this.parentElement?.children.indexOf(this) ?? -1;
    if (index !== -1) this.parentElement.children.splice(index, 1);
    this.parentElement = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector) {
    const candidates = [this, ...descendantsOf(this)];
    if (selector === ":scope > li.user") {
      return this.children.filter(
        (child) => typeof child !== "string" && matchesSimple(child, "li.user"),
      );
    }
    return candidates.filter((candidate) => matches(candidate, selector));
  }
}

class Document {
  constructor() {
    this.children = [];
  }

  createElement(tagName) {
    return new Element(tagName, this);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector) {
    return this.children.flatMap((child) => [child, ...descendantsOf(child)])
      .filter((candidate) => matches(candidate, selector));
  }
}

function descendantsOf(node) {
  return node.children
    .filter((child) => typeof child !== "string")
    .flatMap((child) => [child, ...descendantsOf(child)]);
}

function matchesSimple(node, selector) {
  const [tagName, className] = selector.split(".");
  return (
    node.tagName === tagName &&
    (!className || node.className.split(/\s+/).includes(className))
  );
}

function matches(node, selector) {
  if (selector === ".navTabs") {
    return node.tagName === "ul" && node.className.split(/\s+/).includes("navTabs");
  }
  if (selector === "#memberUserList") return node.getAttribute("id") === "memberUserList";
  if (selector === COUNT_SELECTOR) return node.getAttribute("data-bangumi-friends-count") !== null;

  const navTabMatch = /^\.navTabs a\[href\$="([^"]+)"\]$/.exec(selector);
  if (navTabMatch) {
    return (
      matchesHref(node, navTabMatch[1]) &&
      Boolean(ancestorWithClass(node, "navTabs"))
    );
  }

  const tabMatch = /^a\[href\$="([^"]+)"\]$/.exec(selector);
  if (tabMatch) return matchesHref(node, tabMatch[1]);

  return false;
}

function matchesHref(node, suffix) {
  return node.tagName === "a" && node.getAttribute("href")?.endsWith(suffix);
}

function ancestorWithClass(node, className) {
  let current = node.parentElement;
  while (current) {
    if (current.className.split(/\s+/).includes(className)) return current;
    current = current.parentElement;
  }
  return null;
}

class MutationObserverStub {
  static active = new Set();

  constructor(callback) {
    this.callback = callback;
    this.connected = false;
  }

  observe(target, options) {
    assert.equal(options.childList, true);
    assert.equal(options.subtree, true);
    this.target = target;
    this.connected = true;
    MutationObserverStub.active.add(this);
  }

  disconnect() {
    this.connected = false;
    MutationObserverStub.active.delete(this);
  }

  static flush() {
    for (const observer of [...MutationObserverStub.active]) {
      if (observer.connected) observer.callback([]);
    }
  }

  static reset() {
    MutationObserverStub.active.clear();
  }
}

function createTimers() {
  let nextId = 0;
  const pending = new Map();
  return {
    pending,
    setTimeout(callback, delay) {
      assert.equal(delay, 10_000);
      const id = ++nextId;
      pending.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      pending.delete(id);
    },
    runAll() {
      for (const callback of [...pending.values()]) callback();
    },
  };
}

function createPage({ pathname, withReverse = false, withNav = true } = {}) {
  const document = new Document();
  const nav = document.createElement("ul");
  nav.className = "navTabs";
  const friendsItem = document.createElement("li");
  const friendsTab = document.createElement("a");
  friendsTab.className = "focus native";
  friendsTab.setAttribute("href", "/user/foo/friends");
  const nativeLabel = document.createElement("strong");
  nativeLabel.textContent = "好友";
  friendsTab.append(nativeLabel);
  friendsItem.append(friendsTab);
  nav.append(friendsItem);

  if (withNav) document.children.push(nav);

  const friendsList = document.createElement("ul");
  friendsList.setAttribute("id", "memberUserList");
  for (let index = 0; index < 2; index += 1) {
    const user = document.createElement("li");
    user.className = "user";
    if (index === 0) {
      const nested = document.createElement("li");
      nested.className = "user";
      user.append(nested);
    }
    friendsList.append(user);
  }
  document.children.push(friendsList);

  const timers = createTimers();
  const page = {
    document,
    nav,
    friendsTab,
    friendsList,
    timers,
    location: { pathname },
    runtime: {
      document,
      location: { pathname },
      MutationObserver: MutationObserverStub,
      setTimeout: timers.setTimeout,
      clearTimeout: timers.clearTimeout,
    },
  };

  if (withReverse) page.reverseTab = addReverseTab(page);
  return page;
}

function addReverseTab(page) {
  const item = page.document.createElement("li");
  const tab = page.document.createElement("a");
  tab.className = "focus reverse";
  tab.setAttribute("href", "/user/foo/rev_friends");
  tab.textContent = "反向好友";
  item.append(tab);
  page.nav.append(item);
  return tab;
}

function countNodes(page) {
  return page.nav.querySelectorAll(COUNT_SELECTOR);
}

function run(page) {
  initialize(page.runtime);
}

test("metadata keeps the three supported hosts and two page paths", () => {
  for (const host of ["bgm.tv", "bangumi.tv", "chii.in"]) {
    for (const page of ["friends", "rev_friends"]) {
      assert.match(SOURCE, new RegExp(`@match\\s+https://${host}/user/\\*/${page}`));
    }
  }
  assert.doesNotMatch(SOURCE, /a\.focus\[href\$="\/friends"\]/);
  assert.doesNotMatch(SOURCE, /friendsTab\.textContent\s*=/);
});

test("ordinary friends page counts direct users without touching the tab", () => {
  MutationObserverStub.reset();
  const page = createPage({ pathname: "/user/foo/friends" });
  const nativeLabel = page.friendsTab.children[0];
  const originalClass = page.friendsTab.className;

  run(page);

  assert.equal(page.friendsTab.textContent, "好友（2 名好友）");
  assert.equal(page.friendsTab.children[0], nativeLabel);
  assert.equal(page.friendsTab.className, originalClass);
  assert.equal(countNodes(page).length, 1);
  assert.equal(MutationObserverStub.active.size, 0);
  assert.equal(page.timers.pending.size, 0);
});

test("reverse page falls back to the friends tab when navigation is absent", () => {
  MutationObserverStub.reset();
  const page = createPage({ pathname: "/user/foo/rev_friends" });

  run(page);

  assert.equal(page.friendsTab.textContent, "好友（2 名反向好友）");
  assert.equal(page.document.querySelector('a[href$="/rev_friends"]'), null);
  assert.equal(MutationObserverStub.active.size, 1);
  assert.equal(page.timers.pending.size, 1);

  page.timers.runAll();
  assert.equal(MutationObserverStub.active.size, 0);
  assert.equal(page.timers.pending.size, 0);
});

test("reverse page uses an existing reverse tab immediately", () => {
  MutationObserverStub.reset();
  const page = createPage({ pathname: "/user/foo/rev_friends/", withReverse: true });
  const friendsClass = page.friendsTab.className;
  const reverseClass = page.reverseTab.className;

  run(page);

  assert.equal(page.friendsTab.textContent, "好友");
  assert.equal(page.reverseTab.textContent, "反向好友（2 名反向好友）");
  assert.equal(countNodes(page).length, 1);
  assert.equal(countNodes(page)[0].parentElement, page.reverseTab);
  assert.equal(page.friendsTab.className, friendsClass);
  assert.equal(page.reverseTab.className, reverseClass);
  assert.equal(MutationObserverStub.active.size, 0);
  assert.equal(page.timers.pending.size, 0);
});

test("count-first execution moves the same node when the reverse tab appears", () => {
  MutationObserverStub.reset();
  const page = createPage({ pathname: "/user/foo/rev_friends" });

  run(page);
  const countNode = countNodes(page)[0];
  const friendsClass = page.friendsTab.className;
  const reverseTab = addReverseTab(page);
  MutationObserverStub.flush();

  assert.equal(reverseTab.querySelector(COUNT_SELECTOR), countNode);
  assert.equal(page.friendsTab.querySelector(COUNT_SELECTOR), null);
  assert.equal(countNode.textContent, "（2 名反向好友）");
  assert.equal(reverseTab.className, "focus reverse");
  assert.equal(page.friendsTab.className, friendsClass);
  assert.equal(MutationObserverStub.active.size, 0);
  assert.equal(page.timers.pending.size, 0);
});

test("repeated execution leaves one count node and one short-lived observer", () => {
  MutationObserverStub.reset();
  const page = createPage({ pathname: "/user/foo/rev_friends" });

  run(page);
  const countNode = countNodes(page)[0];
  const firstObserver = [...MutationObserverStub.active][0];
  run(page);

  assert.equal(countNodes(page).length, 1);
  assert.equal(countNodes(page)[0], countNode);
  assert.equal(firstObserver.connected, false);
  assert.equal(MutationObserverStub.active.size, 1);
  assert.equal(page.timers.pending.size, 1);
});

test("unsupported paths and missing page elements remain untouched", () => {
  for (const pathname of ["/user/foo", "/user/foo/blog", "/user/foo/friends/extra"]) {
    MutationObserverStub.reset();
    const page = createPage({ pathname });
    run(page);
    assert.equal(countNodes(page).length, 0, pathname);
    assert.equal(page.friendsTab.textContent, "好友", pathname);
  }

  MutationObserverStub.reset();
  const withoutNav = createPage({ pathname: "/user/foo/friends", withNav: false });
  run(withoutNav);
  assert.equal(countNodes(withoutNav).length, 0);
  assert.equal(MutationObserverStub.active.size, 0);
});

test("all supported hosts use the same pathname behavior", () => {
  for (const host of ["bgm.tv", "bangumi.tv", "chii.in"]) {
    const page = createPage({ pathname: "/user/foo/friends" });
    page.runtime.location = { host, pathname: "/user/foo/friends" };
    run(page);
    assert.equal(page.friendsTab.textContent, "好友（2 名好友）", host);
  }
});

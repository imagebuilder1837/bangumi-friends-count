// ==UserScript==
// @name         Bangumi 好友计数
// @namespace    https://github.com/imagebuilder1837/bangumi-friends-count
// @version      0.1.4
// @description  在好友/反向好友页显示好友/反向好友总数。
// @author       imagebuilder1837
// @match        https://bgm.tv/user/*/friends
// @match        https://bgm.tv/user/*/rev_friends
// @match        https://bangumi.tv/user/*/friends
// @match        https://bangumi.tv/user/*/rev_friends
// @match        https://chii.in/user/*/friends
// @match        https://chii.in/user/*/rev_friends
// @run-at       document-end
// @grant        none
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/imagebuilder1837/bangumi-friends-count/refs/heads/main/src/index.user.js
// @updateURL    https://raw.githubusercontent.com/imagebuilder1837/bangumi-friends-count/refs/heads/main/src/index.user.js
// ==/UserScript==

(() => {
  "use strict";

  const FRIENDS_TAB_SELECTOR = '.navTabs a[href$="/friends"]';
  const REVERSE_TAB_SELECTOR = '.navTabs a[href$="/rev_friends"]';
  const COUNT_SELECTOR = "[data-bangumi-friends-count]";
  const COUNT_ATTRIBUTE = "data-bangumi-friends-count";
  const CLEANUP_PROPERTY = "__bangumiFriendsCountCleanup";

  function initialize(runtime = {}) {
    const pageWindow =
      runtime.window ?? (typeof window === "undefined" ? undefined : window);
    const pageDocument =
      runtime.document ??
      (typeof document === "undefined" ? undefined : document);
    const pageLocation =
      runtime.location ??
      pageWindow?.location ??
      (typeof location === "undefined" ? undefined : location);
    const MutationObserverConstructor =
      runtime.MutationObserver ??
      pageWindow?.MutationObserver ??
      (typeof MutationObserver === "undefined" ? undefined : MutationObserver);
    if (!pageDocument || !pageLocation) return;

    const pathname = pageLocation.pathname;
    if (!/^\/user\/[^/]+\/(?:friends|rev_friends)\/?$/.test(pathname)) {
      return;
    }

    const isReverse = /\/rev_friends\/?$/.test(pathname);
    const friendsTab = pageDocument.querySelector(FRIENDS_TAB_SELECTOR);
    const reverseTab = pageDocument.querySelector(REVERSE_TAB_SELECTOR);
    const friendsList = pageDocument.querySelector("#memberUserList");

    if (!friendsTab || !friendsList) return;

    const navTabs = pageDocument.querySelector(".navTabs");
    if (!navTabs) return;

    const countNodes = [...navTabs.querySelectorAll(COUNT_SELECTOR)];
    for (const node of countNodes) node[CLEANUP_PROPERTY]?.();

    const countNode = countNodes[0] ?? pageDocument.createElement("span");
    for (const node of countNodes.slice(1)) node.remove();

    const targetTab = isReverse ? reverseTab || friendsTab : friendsTab;
    const friendsCount =
      friendsList.querySelectorAll(":scope > li.user").length;
    const label = isReverse ? "反向好友" : "好友";

    countNode.setAttribute(COUNT_ATTRIBUTE, "");
    countNode.textContent = `（${friendsCount} 名${label}）`;
    targetTab.append(countNode);
    const syncTab = () => {
      const currentTab = isReverse
        ? navTabs.querySelector(REVERSE_TAB_SELECTOR) || friendsTab
        : friendsTab;
      if (countNode.parentElement !== currentTab) currentTab.append(countNode);
      countNode.hidden = !currentTab.classList.contains("focus");
    };
    syncTab();

    if (!MutationObserverConstructor) return;
    const observer = new MutationObserverConstructor(syncTab);
    countNode[CLEANUP_PROPERTY] = () => observer.disconnect();
    observer.observe(navTabs, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });
  }

  const core = { initialize };

  if (
    typeof module === "object" &&
    module.exports &&
    typeof document === "undefined"
  ) {
    module.exports = core;
    return;
  }

  initialize();
})();

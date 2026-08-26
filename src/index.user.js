// ==UserScript==
// @name         Bangumi 好友计数
// @namespace    https://github.com/imagebuilder1837/bangumi-friends-count
// @version      0.1.2
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
  'use strict';

  const friendsTab = document.querySelector('.navTabs a.focus[href$="/friends"]');
  const friendsList = document.querySelector('#memberUserList');

  if (!friendsTab || !friendsList) {
    return;
  }

  const friendsCount = friendsList.querySelectorAll(':scope > li.user').length;
  const label = location.href.endsWith('/rev_friends') ? '反向好友' : '好友';
  friendsTab.textContent = `好友（${friendsCount} 名${label}）`;
})();

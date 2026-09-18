# Agent instructions

## Project-specific rules

### Issue 写操作

Agent 默认禁止任何 issue 写操作，包括创建、评论、编辑、添加或移除标签、关闭 issue，以及其他会改变 issue 状态的操作。

只有在人工明确要求时才允许执行，例如用户在对话中明确要求，或用户显式调用负责 issue 写操作的 skill。只读查询默认允许。

### Conventional Commits

提交信息必须使用约定式提交格式：

`<type>(<scope>): <subject>`

常用 type：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`chore`、`ci`。

破坏性变更使用 type 后的 `!`，或在正文中包含 `BREAKING CHANGE:`。subject 使用祈使语气，不加句号。

### 脚本元数据

`src/index.user.js` 头部元数据块中的 `@name`、`@version`、`@description`、`@namespace`、`@match` 等字段，以及 `package.json` 中的 `version` 和其他版本/元数据字段，只能由人工手动管理。

Agent 未经明确允许不得修改这些字段。

### Bangumi 样式

新增样式前，先探索目标页面的 DOM 与样式表，查找并复用 Bangumi 原站已有的 CSS 类、CSS 变量和既有视觉语言。

只有确认没有可复用的样式后，才手写新的 CSS。

## Agent skills

### Issue tracker

Issues live in GitHub Issues; issue writes are disabled by default and require explicit human authorization. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository using root-level `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

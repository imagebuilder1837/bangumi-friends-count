# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for operations.

## Agent write policy

Issue write operations are disabled by default. Do not create, comment on, edit, label, or close issues unless a human explicitly requests the operation in the conversation or explicitly invokes a skill whose purpose includes that operation.

Read-only issue operations are allowed by default.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies. Requires explicit human authorization.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`. Requires explicit human authorization.
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`. Requires explicit human authorization.
- **Close**: `gh issue close <number> --comment "..."`. Requires explicit human authorization.

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Do not publish by default. First require explicit human authorization for the issue write operation.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Wayfinding issue creation, claiming, commenting, labeling, closing, and dependency changes are also issue writes and require explicit human authorization.

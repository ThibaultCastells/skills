# Skills

Personal agent skills compatible with the `skills` CLI.

## Available Skills

- `codex-reset-expiry`
- `explain-root-cause`
- `investigation-mode`

## Install

Install one skill into the current project:

```bash
npx skills add ThibaultCastells/skills --skill explain-root-cause
```

Install all skills into the current project:

```bash
npx skills add ThibaultCastells/skills --skill '*'
```

Install globally instead of locally:

```bash
npx skills add ThibaultCastells/skills --skill '*' -g
```

By default, the CLI auto-detects installed agents. To choose an agent explicitly, pass `-a`:

```bash
npx skills add ThibaultCastells/skills --skill investigation-mode -a codex
```

You can combine flags:

```bash
npx skills add ThibaultCastells/skills --skill '*' -g -a codex
```

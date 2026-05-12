# Hotrod

Roboto Studio's open-source, agent-first website starter. Built on [Astro](https://astro.build/) and tailored for sites that are built, edited, and maintained primarily by coding agents.

> Heads up: Hotrod assumes you are driving development through an agent (Claude Code, Cursor, etc.). Conventions, scripts, and project structure are tuned for that workflow rather than hand-editing.

## Getting started

```sh
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:4321`.

## Project structure

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
├── astro.config.mjs
└── package.json
```

Astro serves `.astro` and `.md` files in `src/pages/` as routes based on file name. Static assets live in `public/`.

## Commands

All commands run from the project root.

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `pnpm install`    | Install dependencies                         |
| `pnpm dev`        | Start the local dev server at `localhost:4321` |
| `pnpm build`      | Build the production site to `./dist/`       |
| `pnpm preview`    | Preview the production build locally         |
| `pnpm astro ...`  | Run Astro CLI commands (`astro add`, `astro check`, etc.) |

## License

MIT © Roboto Studio

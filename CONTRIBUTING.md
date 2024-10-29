
# Contributing
Right now there aren't any specific requests or recommendations for
contributing, but if you're interested in getting involved or have questions,
feel free to open up a new topic in the [Runrig Discussions] board. You can also
view the [roadmap] and [kanban] where we're chiefly managing the project
collectively.

This first pilot is implemented as a single-page application (SPA) that can be
deployed to any CDN service, such as those provided by Vercel, Netlify or
Cloudflare. Refer to your hosting service for primary documentation on how to
configure and deploy, but you'll mainly just need to set it up to install the
required NPM packages via `npm install`, then by running the build script, `npm
run build`.

Below are the original instructions that were generated via [`create-vue`].

[Runrig Discussions]: https://github.com/orgs/runrig-coop/discussions/
[roadmap]: https://github.com/orgs/runrig-coop/projects/3
[kanban]: https://github.com/orgs/runrig-coop/projects/3/views/3
[`create-vue`]: https://github.com/vuejs/create-vue

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

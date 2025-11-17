# Contributor Manual

We welcome contributions of any size and skill level. As an open source project, we believe in giving back to our contributors and are happy to help with guidance on PRs, technical writing, and turning any feature idea into a reality.

## Feature requests

We're open to feature requests of all kinds. If you have an idea for what you want to see, we ask that you:
- **First open a GitHub issue** clearly describing the problem you're trying to solve. Optionally, you can also propose a solution in the issue.
- Once we have decided on an API design, you can start working on a PR. We encourage new contributors to work on PRs themselves, and we're happy to help with guidance and review! If you aren't able to submit a PR yourself, feel free to call that out.

**⚠️ We strongly discourage PRs for undiscussed feature requests.** If you have an idea for a new feature, please start by opening a GitHub issue so we can discuss the API design together. I'm very open to new suggestions, but I would hate to have contributors spend time on high-quality PR for an API design that we don't agree on.

## Setup Guide

### Prerequisites

```bash
node: "^>=18.20.8"
pnpm: "^10.12.1"
```

We also recommend install the [Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) to lint and format as you work.

### Run your first build

You can use the following commands to install dependencies and build the project:

```bash
pnpm install
pnpm run build
```

If you want to run the build / type checker as you work, you can use the `dev` script:

```bash
pnpm run dev
```

### Run the tests

This project uses [Vitest](https://vitest.dev/) as its testing framework. You can use the following commands to run the tests:

```bash
# To run unit tests
pnpm run test
# To run React renderer tests
pnpm run test:ui
```

### Get ready for PR

Before submitting a PR, please run the following commands to ensure your code is ready for review:

```bash
pnpm run check
pnpm run test
```

This will run the linter, formatter, and tests to ensure your code is ready for review. All tests should pass before submitting a PR!

## PR checklist

When making a PR, please ensure that you:

- Have ensured that you have run the linter, formatter, and tests.
- Have linked to an issue that you are addressing (this is **required** for feature requests).
- Have clearly outlined your testing strategy. Unit test and UI test coverage is strongly encouraged!
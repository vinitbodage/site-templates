# AEM Block Collection

This project provides a foundation for starting an AEM Edge Delivery Services project. It includes many common blocks and features a project might need.

## DA compatible

This specific repo has been _slightly_ modified to be compatible with DA's live preview.

## Getting started

### 1. Github
1. Use this template to make a new repo.
1. Install [AEM Code Sync](https://github.com/apps/aem-code-sync).

### 2. DA content
1. Browse to https://da.live/start.
2. Follow the steps.

### 3. Local development
1. Clone your new repo to your computer.
1. Install the AEM CLI using your terminal: `sudo npm install -g @adobe/aem-cli`
1. Start the AEM CLI: `aem up`.
1. Open the `{repo}` folder in your favorite code editor and buil something.
1. **Recommended:** Install common npm packages like linting and testing: `npm i`.

## Forms on da.live

This repo includes the [AEM Forms EDS](https://github.com/adobe-rnd/aem-boilerplate-forms) runtime (`blocks/form/`), authored as a **DA document block** (a link to the form definition), not as nested XWalk form fields.

Authors can drop a **Form** block on any page — including `template2` and `template4` — and point it at either:

- a document-based (spreadsheet) form JSON
- a published AEM Adaptive Form model: `.../guideContainer.model.json`

### Author a form on a page

1. In [da.live](https://da.live/start), add a **Form** block to a section.
2. Set the block link to the published form JSON.
3. Preview / publish. The block fetches the definition, renders fields, and submits to Adobe Forms (`https://forms.adobe.com/adobe/forms/af/submit/`).

Spreadsheet definitions use the document rule engine. Adaptive Form JSON uses the Forms EDS worker.

Form structure is authored in the spreadsheet or in AEM Forms — not as nested field components in the DA page.

### Custom form components

```sh
npm run create:custom-component
```

That scaffolds JS, CSS, and JSON under `blocks/form/components/` and updates `blocks/form/mappings.js`.

### Refresh the Adaptive Forms runtime

```sh
npm run update
```

This re-bundles `@aemforms/af-core`, `@aemforms/af-formatters`, and `@adobe/json-formula` into `blocks/form/rules/`.

### Related files

| Path | Role |
|------|------|
| `blocks/form/` | Form runtime (spreadsheet + Adaptive Forms) |
| `ue/models/blocks/form.json` | DA Form block (URL link) |
| `rollup/` | Runtime bundler configs |

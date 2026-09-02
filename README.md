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

## AEM Forms on Edge Delivery Services

This repo includes the [AEM Forms EDS](https://github.com/adobe-rnd/aem-boilerplate-forms) runtime (`blocks/form/`). Authors can drop an **Adaptive Form** block on any page — including `template2` and `template4` — and point it at either:

- an AEM Adaptive Form model: `.../guideContainer.model.json`
- a document-based (spreadsheet) form JSON

### Prerequisites

- Node.js 18.3 or newer
- AEM Cloud Service 2024.8 or newer (release `17465+`) when using Adaptive Forms authored in AEM
- `npm i` so the bundled `@aemforms/af-core` runtime and Rollup update scripts are available

### Author a form on a page

1. In DA / Universal Editor, add an **Adaptive Form** block to a section.
2. Set **Form definition URL** to the published form JSON.
3. Publish the page. The form block fetches the definition, renders fields, runs the rule engine, and submits to Adobe Forms (`https://forms.adobe.com/adobe/forms/af/submit/`).

Document-based forms still work: the block detects a spreadsheet definition and uses the document rule engine instead of the Adaptive Forms worker.

### Custom form components

```sh
npm run create:custom-component
```

That scaffolds JS, CSS, and UE JSON under `blocks/form/components/` and updates `blocks/form/mappings.js`.

### Refresh the Adaptive Forms runtime

```sh
npm run update
```

This re-bundles `@aemforms/af-core`, `@aemforms/af-formatters`, and `@adobe/json-formula` into `blocks/form/rules/`.

### Related files

| Path | Role |
|------|------|
| `blocks/form/` | Adaptive Forms + document-based form runtime |
| `scripts/form-editor-support.js` | Universal Editor form authoring |
| `scripts/editor-support.js` | AEM UE (xwalk) patch handler |
| `ue/models/blocks/form.json` | DA / UE Adaptive Form block |
| `rollup/` | Runtime bundler configs |

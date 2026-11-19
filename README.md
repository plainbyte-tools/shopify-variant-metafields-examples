# Shopify variant metafields: integration examples

Client examples from **PlainByte Tools** for [Shopify Variant Metafields CSV Validator & Planner](https://apify.com/ministrant_ram/shopify-variant-metafields-planner), a paid Apify Actor. The hosted service validates CSV input and prepares GraphQL request batches for a separate authorized Shopify executor.

## What is included

- [n8n workflow JSON](integrations/n8n/shopify_variant_metafields_workflow.json): four core nodes, started manually, with no credential attached.
- [n8n setup guide](integrations/n8n/README.md): input, authentication, spending limit, result handling and timeout recovery.
- [Example responses](integrations/n8n/sample_responses.json): locally generated `ready`, `blocked` and `no_changes` reports using fictional data.
- [Local verification script](integrations/n8n/verify_workflow.mjs): checks the workflow configuration and report-handling JavaScript without network requests.
- [API tutorial](tutorial.md): an invalid identifier, its diagnostic, the corrected example and an API request.
- [Example API input](input.json): one fictional variant and one field mapping.

This repository contains client integration examples. It does not contain or run the hosted validation engine. It never writes to Shopify and does not require Shopify credentials.

## Start here

Before spending anything on Apify, inspect the [sample reports](integrations/n8n/sample_responses.json) to see the row diagnostics and planned GraphQL requests. If you already use n8n, read the setup guide and import the workflow JSON. Importing it does not start the Actor. Select your own Apify credential only when you intend to authorize an execution.

If you use another API client, follow the tutorial with `input.json`. Replace fictional data before practical use. The Actor identifier is:

```text
ministrant_ram/shopify-variant-metafields-planner
```

For compatible MCP clients, the [Actor-specific connection](https://mcp.apify.com?tools=ministrant_ram/shopify-variant-metafields-planner) exposes the tool through Apify. The client needs authentication and permission to spend. An exact-name MCP discovery and details lookup were verified on 19 November 2026; no Actor execution through MCP was performed for this kit.

## Price and scope

The configured price is **USD 1 per completed report**, including `blocked` and `no_changes`, plus **USD 0.00005 per start**. One report covers one input file within the Actor's limits. The included workflow caps each run at **USD 1.01**; that is a budget, not the price. Repeating a run can incur another charge. Read the current pricing before use.

The Actor supports the `custom` namespace and six documented scalar types. It requires supplied variant IDs or an exact SKU mapping. It does not query a live store, check remote metafield definitions or perform imports. A `ready` report still requires review and separate authorization before its requests are executed elsewhere.

The caller's n8n hosting or subscription is separate. This kit includes no cloud service, scheduled task, model API or paid hosting setup.

## Verification status

The configuration, input expression and JavaScript report handler passed local checks covering 17 response cases on 19 November 2026. Run the local check from this directory with Node.js:

```sh
node integrations/n8n/verify_workflow.mjs
```

The published workflow imported successfully through the CLI in a local n8n 2.48.6 instance. With the HTTP node pointed at a local mock, the n8n engine handled `ready`, `blocked`, and `no_changes` and stopped on malformed data or HTTP 500. All three valid reports retained `shopify_write_authorized: false`. The test did not authenticate with Apify, run the hosted Actor, or contact Shopify. The workflow has not been submitted to the n8n template catalog.

Prepared with AI assistance. PlainByte Tools develops and monetizes the linked Actor. This is an independent project, with no endorsement by Shopify, Apify or n8n.

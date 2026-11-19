# Validate Shopify variant metafields CSV in n8n

This four-node workflow calls [Shopify Variant Metafields CSV Validator & Planner](https://apify.com/ministrant_ram/shopify-variant-metafields-planner) and returns its validation report. It is intended for agencies and developers who already use n8n and have a separately authorized Shopify process.

**The workflow validates and plans. It never connects to Shopify or applies changes.** It contains no AI model node, schedule or webhook. No extra n8n community package is required: it uses Manual Trigger, Code and HTTP Request nodes.

## Files

- `shopify_variant_metafields_workflow.json`: the workflow JSON to import.
- `sample_responses.json`: three locally generated examples with fictional data: `ready`, `blocked` and `no_changes`.
- `verify_workflow.mjs`: local checks that use those examples without making network requests.

## Cost and execution

Reading or importing this JSON does not execute the Actor. Executing the paid HTTP node uses **your own Apify account**, with a maximum event charge of **USD 1.01 for that run**. The configured price is **USD 1 per completed report plus USD 0.00005 per Actor start**; the completed report is charged even if its status is `blocked` or `no_changes`. USD 1.01 is the cap, not the price. One report covers the input file within the Actor's limits; this workflow sends one file, not one run per row.

The workflow has no credential attached. Configure your own account only when you intend to run it. Your n8n hosting or subscription, if any, is separate. This template does not provide free hosting or pay for the caller's Apify usage. Repeating an execution starts another billable run; the cap is per run, not a lifetime or monthly allowance. Check the Actor's current pricing before use.

## Import and configure

1. In an existing n8n instance, create a workflow and choose **Import from File** from the workflow menu. Select `shopify_variant_metafields_workflow.json`. The JSON sets `active` to `false` and contains only a manual trigger.
2. Open **Edit CSV and mappings**. Replace the fictional `csv_text` and the `fields` mappings with the file you want to check. Keep the input as one item. The example uses a fictional ProductVariant GID and maps the `description` column to `custom.care_instructions` with type `multi_line_text_field`.
3. Open **Validate with Apify - paid**. Under **Generic Credential Type → Header Auth**, create or select a credential with header name `Authorization` and value `Bearer YOUR_APIFY_TOKEN`, replacing `YOUR_APIFY_TOKEN` with your own Apify token. Keep the token in that credential, never in CSV, workflow JSON, chat or a public post.
4. Check the HTTP query settings: `maxTotalChargeUsd=1.01`, `memory=256`, `timeout=60`, `restartOnError=false`, `format=json`. The HTTP wait is 90,000 milliseconds and retries are off. JSON response mode includes response headers and status, which the final node uses to read the full report array.
5. When you authorize the run and its price, execute the workflow manually. Open **Inspect status and requests** to review the output.

Only the `custom` namespace and the documented six metafield types are supported. The Actor does not look up IDs, query live definitions or read current metafield values. For SKU-based input, supply an exact SKU-to-variant mapping using the Actor's documented input contract. Shopify credentials do not belong in this workflow.

## Read the result

| `status` | `next_action` | What to do |
|---|---|---|
| `ready` | `review_requests` | Review `batches[*].request`, target shop, live IDs, definitions and the selected write policy. A separate executor still needs authorization before writing. |
| `blocked` | `correct_input` | Read `issues` for row and column diagnostics. There are no request batches. Correct the source before deciding whether to purchase another report. |
| `no_changes` | `nothing_to_apply` | There are no nonblank operations to plan and no request batches. |

The final node preserves the report and adds `next_action` and `shopify_write_authorized: false`. It rejects missing, multiple, malformed or inconsistent reports, including request batches attached to a non-ready result. A completed n8n workflow or successful HTTP response alone does not mean the CSV passed validation.

No downstream Shopify node is included. If you later integrate this into a larger workflow, branch on the report's `status` and obtain the shop owner's authorization separately. Never treat `ready` or `next_action` as permission to write.

## If the request times out

A broken connection does not prove the Apify run never started or was not charged. Check **Runs** in the same Apify account before trying again; recover the completed run's report if available. The template has no automatic retry, loop or scheduled execution. Production systems that need recovery across network failures should use Apify's asynchronous run API, retain the returned run ID and fetch that same run's results.

## Verification and limits

The workflow's JSON, node configuration and JavaScript were checked locally on **19 November 2026** against the official sources below. The report handler passed valid, blocked and no-change examples generated by planner version 0.1.0, plus malformed-response cases. To repeat these checks with Node.js:

```sh
node integrations/n8n/verify_workflow.mjs
```

The original workflow imported through the CLI into a local n8n 2.48.6 instance with four nodes and remained inactive. In test copies, a local HTTP mock returned `ready`, `blocked`, `no_changes`, malformed data, and HTTP 500. The first three produced the expected next actions and did not authorize Shopify writes. The final inspector rejected malformed data, and the HTTP node stopped on HTTP 500. No retries were observed.

This checks workflow import and behavior under simulated responses, not a live Apify integration. Apify credentials, the deployed Actor response, and GUI import were not tested. No paid request, live store access or Shopify write was performed.

## Official references

- [Apify: run an Actor synchronously and retrieve dataset items](https://docs.apify.com/api/v2/actor-run-sync-get-dataset-items-post)
- [n8n: export and import workflows](https://docs.n8n.io/workflows/export-import/)
- [n8n: HTTP Request node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [n8n: HTTP Request credentials](https://docs.n8n.io/integrations/builtin/credentials/httprequest/)
- [n8n: HTTP Request implementation and supported versions](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/HttpRequest/V3/HttpRequestV3.node.ts)
- [n8n: HTTP Request parameter definitions](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/HttpRequest/V3/Description.ts)
- [n8n: Code node](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Code/Code.node.ts)
- [n8n: Manual Trigger node](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/ManualTrigger/ManualTrigger.node.ts)

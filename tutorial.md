# Validate Shopify variant metafield CSV files before an AI agent writes to your store

*By PlainByte Tools. Disclosure: we develop and monetize the [Shopify Variant Metafields CSV Validator & Planner](https://apify.com/ministrant_ram/shopify-variant-metafields-planner) discussed here. Prepared with AI assistance; example outputs were checked locally against the planner. This is an independent tool, not a Shopify or Apify endorsement. Examples use fictional data.*

## The specific problem

[Shopify's native product CSV import/export does not support variant metafields](https://help.shopify.com/en/manual/products/import-export/using-csv). A developer building a custom import therefore needs a separate way to check incoming values and prepare requests for the Admin API.

Our Actor handles that preparation step. It accepts CSV text and explicit column mappings, identifies input errors and duplicate destinations, and generates `metafieldsSet` GraphQL bodies. It never connects to Shopify or modifies a store. This is useful when an agency or automation already has an authorized Shopify executor and the correct variant IDs.

## Start with a deliberately invalid identifier

Save this example as `input.json`:

```json
{
  "csv_text": "variant_id,description\n1001,Machine washable\n",
  "fields": [
    {
      "column": "description",
      "namespace": "custom",
      "key": "care_instructions",
      "type": "multi_line_text_field"
    }
  ],
  "write_policy": "create_only"
}
```

The identifier `1001` fails the required canonical ProductVariant GID format. This excerpt comes from the planner's local output for that input; omitted metadata and counters remain part of the full report:

```json
{
  "status": "blocked",
  "issues": [
    {
      "severity": "error",
      "code": "VARIANT_GID",
      "message": "Identifier does not resolve to one canonical ProductVariant GID.",
      "row": 2,
      "column": "variant_id"
    }
  ],
  "batches": []
}
```

Correct the CSV value to `gid://shopify/ProductVariant/1001`, keeping the other settings. The corresponding local result is `ready`, with one planned operation, one batch and no validation errors. The generated operation contains `compareDigest: null`, reflecting the default `create_only` policy. That fictional ID passing a format check does not establish that it exists in any store.

## Call it through the API

The same JSON works through Apify's [synchronous run-and-dataset endpoint](https://docs.apify.com/api/v2/actor-run-sync-get-dataset-items-post). With your own Apify token available as `APIFY_TOKEN`, the following command starts a billable run and returns its dataset items:

```bash
curl --fail-with-body --silent --show-error --retry 0 --max-time 90 \
  --request POST \
  'https://api.apify.com/v2/actors/ministrant_ram~shopify-variant-metafields-planner/run-sync-get-dataset-items?timeout=60&memory=256&maxTotalChargeUsd=1.01&restartOnError=false&format=json' \
  --header "Authorization: Bearer ${APIFY_TOKEN:?Set your own Apify token}" \
  --header 'Content-Type: application/json' \
  --data-binary @input.json
```

The response is a JSON array containing one report. Inspect that report's `status`, not just the HTTP response or Apify's run status. A successful execution can correctly return a `blocked` validation report. If a connection breaks, inspect your runs before resubmitting: a second POST can start another chargeable run. This command was reviewed against the API documentation; it was not executed while preparing this article.

| Report status | Next step |
|---|---|
| `blocked` | Read the issues and correct the source data. No requests are produced. |
| `ready` | Review `batches[*].request` before separately authorized execution. |
| `no_changes` | No nonblank changes were planned; no requests are produced. |

## Connecting an agent or workflow

An MCP-capable client can use the [Actor-specific Apify MCP connection](https://mcp.apify.com?tools=ministrant_ram/shopify-variant-metafields-planner). Configure authentication and spending authorization in the client; see [Apify's MCP documentation](https://docs.apify.com/mcp). The connection is not automatically available to every assistant, and we have not demonstrated an MCP execution for this example.

A companion n8n workflow is in preparation. Its current status is local review only: no import into n8n, end-to-end n8n execution or template-catalog submission has been completed. The intended flow submits CSV input, reads the report and separates the three outcomes. It does not include a Shopify writer.

## Price and scope

Each completed report costs **USD 1**, including `blocked` and `no_changes`, plus **USD 0.00005 per Actor start** at supported memory settings. One start and one report total **USD 1.00005** in event charges; infrastructure is included. **USD 1.01 is the minimum run budget, not the price.** Re-running corrected data produces another billable report. A started run can incur its start charge without completing a report.

The planner supports the `custom` namespace and six documented scalar types. It checks supplied data, not live variant existence, store permissions or metafield definitions. Keep Shopify credentials in your separate executor. Before using real data, review the [full input contract, limits and pricing](https://apify.com/ministrant_ram/shopify-variant-metafields-planner).

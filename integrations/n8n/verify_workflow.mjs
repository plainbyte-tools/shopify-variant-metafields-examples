// Local-only checks. This script makes no network requests and needs no token.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const workflow = read('shopify_variant_metafields_workflow.json');
const samples = read('sample_responses.json').cases;
const nodes = Object.fromEntries(workflow.nodes.map(node => [node.name, node]));
const inputNode = nodes['Edit CSV and mappings'];
const httpNode = nodes['Validate with Apify - paid'];
const finalNode = nodes['Inspect status and requests'];

assert.equal(workflow.active, false);
assert.equal(workflow.nodes.length, 4);
assert.equal(new Set(workflow.nodes.map(node => node.id)).size, 4);
assert.equal(workflow.nodes.filter(node => node.type.includes('manualTrigger')).length, 1);
assert.equal(workflow.nodes.filter(node => node.type.includes('httpRequest')).length, 1);
assert.equal(workflow.nodes.filter(node => /schedule|webhook|langchain/i.test(node.type)).length, 0);
for (const node of workflow.nodes) assert.equal(node.credentials, undefined);
assert.equal(httpNode.parameters.url, 'https://api.apify.com/v2/actors/ministrant_ram~shopify-variant-metafields-planner/run-sync-get-dataset-items');
assert.equal(httpNode.parameters.method, 'POST');
assert.equal(httpNode.parameters.authentication, 'genericCredentialType');
assert.equal(httpNode.parameters.genericAuthType, 'httpHeaderAuth');
assert.equal(httpNode.parameters.specifyBody, 'json');
assert.equal(httpNode.retryOnFail, false);
assert.equal(httpNode.onError, 'stopWorkflow');
assert.deepEqual(Object.fromEntries(httpNode.parameters.queryParameters.parameters.map(p => [p.name, p.value])), {
  maxTotalChargeUsd: '1.01', memory: '256', timeout: '60', restartOnError: 'false', format: 'json',
});
assert.equal(httpNode.parameters.options.timeout, 90000);
assert.equal(httpNode.parameters.options.response.response.fullResponse, true);
assert.equal(httpNode.parameters.options.response.response.responseFormat, 'json');
assert.equal(httpNode.parameters.options.response.response.neverError, false);
assert.equal(httpNode.parameters.options.redirect.redirect.followRedirects, false);

const chain = ['Start manually', 'Edit CSV and mappings', 'Validate with Apify - paid', 'Inspect status and requests'];
for (let i = 0; i < chain.length - 1; i++) {
  assert.deepEqual(workflow.connections[chain[i]], {
    main: [[{ node: chain[i + 1], type: 'main', index: 0 }]],
  });
}
assert.equal(workflow.connections[chain.at(-1)], undefined);

const inputItems = new Function(inputNode.parameters.jsCode)();
assert.deepEqual(inputItems, [{ json: samples.ready.input }]);
assert.equal(httpNode.parameters.jsonBody, '={{ JSON.stringify($json) }}');
const expression = httpNode.parameters.jsonBody.slice(3, -2).trim();
const body = new Function('$json', `return ${expression};`)(inputItems[0].json);
assert.deepEqual(JSON.parse(body), samples.ready.input);

const gate = new Function('$input', finalNode.parameters.jsCode);
const run = response => gate({ all: () => [{ json: response }] });
const clone = value => JSON.parse(JSON.stringify(value));
let casesChecked = 0;
for (const [status, sample] of Object.entries(samples)) {
  const result = run(clone(sample.http_response));
  assert.equal(result.length, 1);
  assert.equal(result[0].json.status, status);
  assert.equal(result[0].json.shopify_write_authorized, false);
  assert.equal(result[0].json.next_action, {
    ready: 'review_requests', blocked: 'correct_input', no_changes: 'nothing_to_apply',
  }[status]);
  assert.deepEqual(result[0].json.batches, sample.http_response.body[0].batches);
  if (status !== 'ready') assert.equal(result[0].json.batches.length, 0);
  casesChecked++;
}

const badResponses = [
  { statusCode: 500, body: [samples.ready.http_response.body[0]] },
  { statusCode: 201 },
  { statusCode: 201, body: [] },
  { statusCode: 201, body: [...samples.ready.http_response.body, ...samples.ready.http_response.body] },
];
for (const change of [
  r => { r.status = 'unknown'; },
  r => { r.schema_version = '999'; },
  r => { r.summary.error_count = 1; },
  r => { r.summary.batch_count = 0; },
  r => { r.summary.planned_operations = 2; },
  r => { r.batches[0].request.variables.metafields = []; },
  r => { r.remote_requests = 1; },
]) {
  const response = clone(samples.ready.http_response);
  change(response.body[0]);
  badResponses.push(response);
}
const blockedWithRequests = clone(samples.blocked.http_response);
blockedWithRequests.body[0].batches = clone(samples.ready.http_response.body[0].batches);
blockedWithRequests.body[0].summary.batch_count = 1;
badResponses.push(blockedWithRequests);
for (const response of badResponses) {
  assert.throws(() => run(response));
  casesChecked++;
}
assert.throws(() => gate({ all: () => [] }));
assert.throws(() => gate({ all: () => [{ json: samples.ready.http_response }, { json: samples.ready.http_response }] }));
casesChecked += 2;

console.log(JSON.stringify({
  result: 'passed', nodes: 4, response_cases: casesChecked,
  normal_statuses: Object.keys(samples), network_requests: 0,
  scope: 'JSON structure, node configuration, input expression and report-handling JavaScript; not an n8n import or cloud execution',
}, null, 2));

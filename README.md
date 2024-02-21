# API Specification Retriever

Retrieves OpenAPI specs from all repos in a GitHub organisation.

## What is this for?

Teams document their APIs using the OpenAPI standard, in line with [ADR 0105](https://github.com/govuk-one-login/architecture/blob/main/adr/0105-open-standards-api-docs.md).

> **Note**
> See our [guidance on documenting APIs](https://govukverify.atlassian.net/wiki/spaces/DIWAY/pages/3658121299/Documenting+API+endpoints).

It is important to have a view of the APIs teams produce. There is no central registry of APIs, so a mechanism is required to discover them.

## How does it work?

This tool uses the GitHub search API to identify files of type `OASv3` (OpenAPI 3.x) across all of the repositories within our GitHub organisation.

For each OpenAPI specification file returned by GitHub's search results, it is downloaded to a local directory.

## How do I run it?

### Prerequisites

- Node 20.x
- Install dependencies with `npm ci`
- Copy the `.env.example` file to `.env` and set the appropriate configuration values.

### Run

To discover specification files and download them, run

```shell
npm start
```

This will:

1. Call the GitHub search API using the query defined in `.env`
2. For each search result, query GitHub's API for file metadata, such as the download URL
3. Make a `GET` request to the download URL and save the contents of the file to a directory named `specs`

## What can I do with these spec files?

You can:

- get human-readable API specifications
  - See the [openapi-specs repository](https://github.com/govuk-one-login/openapi-specs?tab=readme-ov-file#specifications)
- summarise the APIs into a spreadsheet
  - See the [openapi-summariser repository](https://github.com/govuk-one-login/openapi-summariser)
- create live mocks of these endpoints for use in your development/testing activities
  - Example #1: An example of this used for third party steps by the CRI teams [can be found here](https://github.com/alphagov/di-ipv-third-party-stubs) in the di-ipv-third-party-stubs repo.
  - Example #2: An example of this in the di-openapi-specs repo [can be found here](https://github.com/alphagov/di-openapi-specs/tree/main#mocks).

[Overview](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#overview)[Key Concepts](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#key-concepts)[Recommended Usage](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#recommended-usage)[Security](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#security)[Development Tips](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#development-tips)[Note for AI](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#note-for-ai)

Endpoints

Documents

Blocks

Search

Collections

[List CollectionsGET](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#list-collections)[Get Collection SchemaGET](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-schema)[Get Collection ItemsGET](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-items)[Add Collection ItemsPOST](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#add-collection-items)[Delete Collection ItemsDELETE](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-collection-items)[Update Collection ItemsPUT](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-collection-items)

Tools

[Editor](https://connect.craft.do/link/55aNSaGAKqn/docs/v1/editor)

Copy docs

# Craft – Multi-Document API for My API

https://connect.craft.do/links/55aNSaGAKqn/api/v1

API Server for Multi-Document Connection

Copy Docs

Download DocsCopy Server URL

## [Overview](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#overview)

The Craft Multi-Document API provides programmatic access to multiple Craft documents. Access documents, blocks, collections, and search across your document set with unified authentication.

## [Key Concepts](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#key-concepts)

**Document IDs**: Each document is identified by a short ID (the document's root block ID). Use `GET /documents` to discover available documents and their IDs.

**Cross-Document Operations**: Most operations require specifying which document to work with via block IDs. The API automatically resolves which document a block belongs to.

## [Recommended Usage](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#recommended-usage)

This API is ideal for building integrations that need to work with multiple related documents, such as project documentation sets, knowledge bases, or multi-document workflows.

## [Security](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#security)

The Craft API uses Bearer token type authentication, therefore it is strongly advised to call it from the backend (e.g. from an Edge Function), and store the token as a Secret.

## [Development Tips](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#development-tips)

- Start with `GET /documents` to discover available documents and their IDs
- Use the `id` parameter in `GET /blocks` with a document's ID to fetch that document's content
- When inserting blocks, use `pageId` in the position object to specify the target document/block
- Use `GET /documents/search` to search across all documents with relevance-based ranking
- Collections can span multiple documents - use `GET /collections` to discover them

## [Note for AI](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#note-for-ai)

When implementing functionality using this API, always make actual calls to these endpoints and verify the responses. Do not simulate or mock the API interactions or use hard-coded values on the client-side - use the real endpoints to ensure proper functionality and data handling.

**IMPORTANT: This is a production server connected to real user data.** Only perform testing operations that can be safely rolled back:

- Safe: Reading data (`GET` requests), creating test content that you delete immediately after
- Safe: Modifying content if you can restore it to its original state
- Safe: Moving blocks if you can move them back to their original position
- Unsafe: Permanent deletions, modifications without backup, or any changes you cannot reverse

Always verify rollback operations work before considering a test complete.

## [List Documents](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#list-documents)

GET

/`documents`

Send

Authorization

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#list-documents-summary)

Retrieve all documents accessible through this multi-document connection. Returns document IDs (short IDs used in other endpoints), titles, and deletion status for each document.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#list-documents-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#list-documents-response-body)

200

List of documents with their metadata

itemsDocuments

Array of documents in this multi-document connection

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X GET "https://connect.craft.do/links/55aNSaGAKqn/api/v1/documents"
```

200

List of documents with mixed deletion status

```
{
  "items": [
    {
      "id": "doc-123",
      "title": "Project Plan",
      "isDeleted": false
    },
    {
      "id": "doc-456",
      "title": "Meeting Notes",
      "isDeleted": false
    },
    {
      "id": "doc-789",
      "title": "[Deleted Document]",
      "isDeleted": true
    }
  ]
}
```

## [Fetch Blocks](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#fetch-blocks)

GET

/`blocks`

Send

Authorization

Query

Accept Content Type

application/json

application/jsontext/markdown

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#fetch-blocks-summary)

Fetches content from documents in this multi-document connection. Use 'id' query parameter to specify which block to fetch.

Use `Accept` header `application/json` for structured data, `text/markdown` for rendered content.

**Content Rendering:** Text blocks contain markdown formatting and markdown formatted output may include structural tags like `<page></page>`, etc. When displaying content, consider rendering markdown as formatted text or cleaning up the syntax for plain text display.

**Scope Filtering:** Block links in markdown and collections, as well as relations are filtered to documents scope. Block links and date links are returned as `block://` and `date://` URLs.

**Tip:** Start by calling GET /documents to list available documents, then use their documentId values as the 'id' parameter to fetch each document's root content.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#fetch-blocks-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Query Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#fetch-blocks-query-parameters)

idBlock ID

The ID of the page block to fetch. Required for multi-document operations. Accepts IDs for documents, pages and blocks.

maxDepth?Max Depth

The maximum depth of blocks to fetch. Default is -1 (all descendants). With a depth of 0, only the specified block is fetched. With a depth of 1, only direct children are returned.

Default`-1`

fetchMetadata?Fetch Metadata

Whether to fetch metadata (comments, createdBy, lastModifiedBy, lastModifiedAt, createdAt) for the blocks. Default is false.

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#fetch-blocks-response-body)

200application/json

Fetched block with nested children

Text BlockPage BlockCollection Item BlockImage BlockVideo BlockFile BlockDrawing BlockWhiteboard BlockTable BlockCollection BlockCode BlockRich Link BlockLine Block (Separator)

typeType

Allowed Values:`"text"`

idBlock ID

textStyle?Text Style

h1-h4, body, caption styles apply to text blocks, card and page styles are visual styles for page blocks. Edge cases: a block with 'page' (or 'card') textStyle is always a page block, even if empty, however a page block can exist with 'body' textStyle which will be rendered as normal paragraph (but will otherwise act as a page inside Craft).

Allowed Values:`"card" | "page" | "h1" | "h2" | "h3" | "h4" | "caption" | "body"`

textAlignment?Text Alignment

default is left

Allowed Values:`"left" | "center" | "right" | "justify"`

font?Font

Allowed Values:`"system" | "serif" | "rounded" | "mono"`

cardLayout?Card Layout

Applies for 'card' textStyle. Small and square are for laying out in multi-column (2 or 3 depending on screen size, multi-column is only supported for certain block types, not for text). Regular and large are full width cards.

Allowed Values:`"small" | "square" | "regular" | "large"`

markdownMarkdown

The markdown content of the block.

indentationLevel?Indentation Level

The indentation level of the block.

Range`0 <= value <= 5`

listStyle?List Style

Allowed Values:`"none" | "bullet" | "numbered" | "toggle" | "task"`

decorations?Decorations

Array Item

color?Color

7-character hex code (e.g., #RRGGBB). Case-insensitive. Auto-adjusted for readability, with dark variant auto-generated.

Match`^#[0-9a-fA-F]{6}$`

taskInfo?Task Info

only interpreted, if listStyle is 'task'

Show Attributes

metadata?Block Metadata

Show Attributes

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X GET "https://connect.craft.do/links/55aNSaGAKqn/api/v1/blocks?id=1&maxDepth=-1&fetchMetadata=false"
```

200

Fetch document root by ID

```
{
  "id": "doc-123",
  "type": "page",
  "textStyle": "page",
  "markdown": "<page>Project Plan</page>",
  "content": [
    {
      "id": "1",
      "type": "text",
      "textStyle": "h1",
      "markdown": "# Overview"
    },
    {
      "id": "2",
      "type": "text",
      "markdown": "This is the project overview document."
    }
  ]
}
```

## [Insert Blocks](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#insert-blocks)

POST

/`blocks`

Send

Authorization

Body

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#insert-blocks-summary)

Insert content into documents in this multi-document connection. Content can be provided as structured JSON blocks. Use position parameter to specify where to insert. Returns the inserted blocks with their assigned block IDs for later reference.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#insert-blocks-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Request Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#insert-blocks-request-body)

application/json

objectobject

blocksNew Blocks

The blocks to insert, as JSON array

Array Item

positionPosition

JSON object to insert the content at. Must specify either pageId or siblingId.

Position in a parent pagePosition next to a sibling block

positionPage Position

The position to insert the blocks at. 'start' inserts at the start of the page, 'end' inserts at the end of the page.

Allowed Values:`"start" | "end"`

pageIdPage ID

ID of the block to insert children into. Required for multi-document operations. Only page, text, and card type blocks can be parent blocks. Text blocks are auto-converted to page type when they receive children. Collection items are implicitly pages.

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#insert-blocks-response-body)

200

Array of inserted blocks with assigned IDs

itemsBlocks

Array of blocks

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

Example

Insert text block into document

cURL

JavaScript

Go

Python

Java

C#

```
curl -X POST "https://connect.craft.do/links/55aNSaGAKqn/api/v1/blocks" \
  -H "Content-Type: application/json" \
  -d '{
    "blocks": [
      {
        "type": "text",
        "markdown": "## New Section\n\n- Point A\n- Point B"
      }
    ],
    "position": {
      "position": "end",
      "pageId": "doc-123"
    }
  }'
```

200

```
{
  "items": [
    {
      "type": "text",
      "id": "string",
      "textStyle": "card",
      "textAlignment": "left",
      "font": "system",
      "cardLayout": "small",
      "markdown": "string",
      "indentationLevel": 5,
      "listStyle": "none",
      "decorations": [
        "callout"
      ],
      "color": "string",
      "taskInfo": {
        "state": "todo",
        "scheduleDate": "2019-08-24",
        "deadlineDate": "2019-08-24"
      },
      "metadata": {
        "lastModifiedAt": "2019-08-24",
        "createdAt": "2019-08-24",
        "lastModifiedBy": "string",
        "createdBy": "string",
        "comments": [
          {
            "id": "string",
            "author": "string",
            "content": "string",
            "createdAt": "2019-08-24"
          }
        ]
      }
    }
  ]
}
```

## [Delete Blocks](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-blocks)

DELETE

/`blocks`

Send

Authorization

Body

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-blocks-summary)

Delete content from documents in this multi-document connection. Removes specified blocks by their IDs.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-blocks-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Request Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-blocks-request-body)

application/json

blockIdsBlock IDs

The IDs of the blocks to delete

Array Item

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-blocks-response-body)

200

Array of deleted block IDs

itemsDeleted Block IDs

Array of deleted block IDs

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X DELETE "https://connect.craft.do/links/55aNSaGAKqn/api/v1/blocks" \
  -H "Content-Type: application/json" \
  -d '{
    "blockIds": [
      "7",
      "9",
      "12"
    ]
  }'
```

200

```
{
  "items": [
    {
      "id": "string"
    }
  ]
}
```

## [Update Blocks](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-blocks)

PUT

/`blocks`

Send

Authorization

Body

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-blocks-summary)

Update content across documents in this multi-document connection. For text blocks, provide updated markdown content. Only the fields that are provided will be updated.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-blocks-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Request Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-blocks-request-body)

application/json

blocksBlocks to Update

The blocks to update, as JSON array. Only the fields that are provided will be updated.

Array Item

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-blocks-response-body)

200

Array of updated blocks

itemsBlocks

Array of blocks

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X PUT "https://connect.craft.do/links/55aNSaGAKqn/api/v1/blocks" \
  -H "Content-Type: application/json" \
  -d '{
    "blocks": [
      {
        "id": "5",
        "markdown": "## Updated Section\n\nUpdated content"
      }
    ]
  }'
```

200

```
{
  "items": [
    {
      "type": "text",
      "id": "string",
      "textStyle": "card",
      "textAlignment": "left",
      "font": "system",
      "cardLayout": "small",
      "markdown": "string",
      "indentationLevel": 5,
      "listStyle": "none",
      "decorations": [
        "callout"
      ],
      "color": "string",
      "taskInfo": {
        "state": "todo",
        "scheduleDate": "2019-08-24",
        "deadlineDate": "2019-08-24"
      },
      "metadata": {
        "lastModifiedAt": "2019-08-24",
        "createdAt": "2019-08-24",
        "lastModifiedBy": "string",
        "createdBy": "string",
        "comments": [
          {
            "id": "string",
            "author": "string",
            "content": "string",
            "createdAt": "2019-08-24"
          }
        ]
      }
    }
  ]
}
```

## [Move Blocks](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#move-blocks)

PUT

/`blocks`/`move`

Send

Authorization

Body

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#move-blocks-summary)

Move blocks to reorder them or move them between documents. Returns the moved block IDs.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#move-blocks-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Request Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#move-blocks-request-body)

application/json

blockIdsBlock IDs

The IDs of the blocks to move

Array Item

positionPosition

JSON object to move the content to. Must specify either pageId or siblingId.

Position in a parent pagePosition next to a sibling block

positionPage Position

The position to insert the blocks at. 'start' inserts at the start of the page, 'end' inserts at the end of the page.

Allowed Values:`"start" | "end"`

pageIdPage ID

ID of the block to insert children into. Required for multi-document operations. Only page, text, and card type blocks can be parent blocks. Text blocks are auto-converted to page type when they receive children. Collection items are implicitly pages.

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#move-blocks-response-body)

200

Array of moved block IDs

itemsMoved Block IDs

Array of moved block IDs

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X PUT "https://connect.craft.do/links/55aNSaGAKqn/api/v1/blocks/move" \
  -H "Content-Type: application/json" \
  -d '{
    "blockIds": [
      "9",
      "10"
    ],
    "position": {
      "position": "end",
      "pageId": "doc-456"
    }
  }'
```

200

```
{
  "items": [
    {
      "id": "string"
    }
  ]
}
```

## [Search in Document](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#search-in-document)

GET

/`blocks`/`search`

Send

Authorization

Query

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#search-in-document-summary)

Search content in one single Craft document. This is a secondary search tool that complements documents_search by allowing you to search within a single document.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#search-in-document-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Query Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#search-in-document-query-parameters)

documentIdDocument ID

The document ID to search within.

patternPattern

The search patterns to look for. Supports NodeJS regular expressions.

caseSensitive?Case Sensitive

Whether the search should be case sensitive. Default is false.

beforeBlockCount?Before Block Count

The number of blocks to include before the matched block.

Default`5`

afterBlockCount?After Block Count

The number of blocks to include after the matched block.

Default`5`

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#search-in-document-response-body)

200

Array of search matches with structured context

itemsSearch Matches

Array of search matches with structured context

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X GET "https://connect.craft.do/links/55aNSaGAKqn/api/v1/blocks/search?caseSensitive=true&beforeBlockCount=5&afterBlockCount=5"
```

200

Search for 'project' in specific document

```
{
  "items": [
    {
      "blockId": "5",
      "markdown": "Project planning meeting notes",
      "pageBlockPath": [
        {
          "id": "doc-123",
          "content": "Project Plan"
        }
      ],
      "beforeBlocks": [
        {
          "blockId": "4",
          "markdown": "# Overview"
        }
      ],
      "afterBlocks": [
        {
          "blockId": "6",
          "markdown": "Next steps for the project"
        }
      ]
    }
  ]
}
```

## [Search across Documents](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#search-across-documents)

GET

/`documents`/`search`

Send

Authorization

Query

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#search-across-documents-summary)

Search content across multiple documents using relevance-based ranking. This endpoint uses FlexiSpaceSearch to find matches across the documents in your multi-document connection.

- Search across all documents or filter to specific documents
- Optional document filtering (include or exclude specific documents)
- Relevance-based ranking (top 20 results)
- Content snippets with match highlighting
- Returns exposedDocumentId for each result

**Example Use Cases:**

- Find all mentions of a topic across project documents
- Search for specific content excluding certain documents
- Locate references across a set of related documents

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#search-across-documents-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Query Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#search-across-documents-query-parameters)

includeInclude

Search terms to include in the search. Can be a single string or array of strings.

Array Item

documentIds?Document IDs

The document IDs to filter. If not provided, all documents will be searched. Can be a single string or array of strings.

Array Item

documentFilterMode?Document Filter Mode

Whether to include or exclude the specified documents. Default is 'include'. Only used when documentIds is provided.

Default`"include"`

Allowed Values:`"include" | "exclude"`

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#search-across-documents-response-body)

200

Array of search matches across documents with match highlighting

itemsSearch Matches

Array of individual search matches across documents, ordered by document relevance

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X GET "https://connect.craft.do/links/55aNSaGAKqn/api/v1/documents/search?documentFilterMode=include"
```

200

###

Search for 'API' across all documents

```
{
  "items": [
    {
      "documentId": "doc-123",
      "markdown": "The **API** endpoints are documented..."
    },
    {
      "documentId": "doc-456",
      "markdown": "**API** authentication requires..."
    }
  ]
}
```

###

Search with document filtering

## [List Collections](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#list-collections)

GET

/`collections`

Send

Authorization

Query

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#list-collections-summary)

List all collections across documents in this multi-document connection

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#list-collections-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Query Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#list-collections-query-parameters)

documentIds?Document IDs

The document IDs to filter. If not provided, collections in all documents will be listed.

Array Item

documentFilterMode?Document Filter Mode

Whether to include or exclude the specified documents. Default is 'include'. Only used when documentIds is provided.

Default`"include"`

Allowed Values:`"include" | "exclude"`

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#list-collections-response-body)

200

List of collections with metadata

itemsCollections

Array of collections in the specified documents

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X GET "https://connect.craft.do/links/55aNSaGAKqn/api/v1/collections?documentFilterMode=include"
```

200

Get all collections

```
{
  "items": [
    {
      "key": "col-123",
      "name": "Tasks",
      "documentId": "doc-123",
      "schema": {
        "name": "Tasks",
        "properties": []
      }
    },
    {
      "key": "col-456",
      "name": "Team Members",
      "documentId": "doc-456",
      "schema": {
        "name": "Team Members",
        "properties": []
      }
    }
  ]
}
```

## [Get Collection Schema](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-schema)

GET

/`collections`/`{collectionId}`/`schema`

Send

Authorization

Path

Query

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-schema-summary)

Get the schema for a collection by its ID.

**Format Options** (via `format` query parameter):

- `json-schema-items` (default): Returns JSON Schema for validating collection items (use with add/update endpoints)
- `schema`: Returns the collection's schema structure (name, properties, types)

Use the collection ID from the `/collections` endpoint.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-schema-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Path Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-schema-path-parameters)

collectionIdstring

The unique ID of the collection (obtained from /collections endpoint)

### [Query Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-schema-query-parameters)

format?Format

The format to return the schema in. Default: json-schema-items. - 'schema': Returns the collection schema structure that can be edited - 'json-schema-items': Returns JSON Schema for addCollectionItems/updateCollectionItems validation

Default`"json-schema-items"`

Allowed Values:`"schema" | "json-schema-items"`

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-schema-response-body)

200

Collection schema in requested format

response?unknown

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X GET "https://connect.craft.do/links/55aNSaGAKqn/api/v1/collections/{collectionId}/schema?format=json-schema-items"
```

200

###

JSON Schema format (format=json-schema-items, default)

```
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "properties": {
            "type": "object"
          }
        },
        "required": [
          "title"
        ]
      }
    }
  },
  "required": [
    "items"
  ]
}
```

###

Schema structure format (format=schema)

## [Get Collection Items](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-items)

GET

/`collections`/`{collectionId}`/`items`

Send

Authorization

Path

Query

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-items-summary)

Retrieve all items from a specific collection. Use the collection ID from the `/collections` endpoint.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-items-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Path Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-items-path-parameters)

collectionIdstring

The unique ID of the collection (obtained from /collections endpoint)

### [Query Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-items-query-parameters)

maxDepth?Max Depth

The maximum depth of nested content to fetch for each collection item. Default is -1 (all descendants). With a depth of 0, only the item properties are fetched without nested content.

Default`-1`

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#get-collection-items-response-body)

200

Collection items retrieved successfully

itemsCollection Items

Array of items in the collection.

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X GET "https://connect.craft.do/links/55aNSaGAKqn/api/v1/collections/{collectionId}/items?maxDepth=-1"
```

200

```
{
  "items": [
    {
      "title": "Title 1",
      "properties": {}
    }
  ]
}
```

## [Add Collection Items](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#add-collection-items)

POST

/`collections`/`{collectionId}`/`items`

Send

Authorization

Path

Body

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#add-collection-items-summary)

Add new items to a specific collection.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#add-collection-items-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Path Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#add-collection-items-path-parameters)

collectionIdstring

The unique ID of the collection

### [Request Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#add-collection-items-request-body)

application/json

itemsItems to Add

Items to add to the collection.

Array Item

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#add-collection-items-response-body)

200

Items added successfully

itemsSuccessfully Added Items

Array of successfully added items

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X POST "https://connect.craft.do/links/55aNSaGAKqn/api/v1/collections/{collectionId}/items" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "title": "string"
      }
    ]
  }'
```

200

```
{
  "items": [
    {
      "title": "Title 1",
      "properties": {}
    }
  ]
}
```

## [Delete Collection Items](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-collection-items)

DELETE

/`collections`/`{collectionId}`/`items`

Send

Authorization

Path

Body

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-collection-items-summary)

Delete items from a specific collection by their IDs.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-collection-items-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Path Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-collection-items-path-parameters)

collectionIdstring

The unique ID of the collection

### [Request Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-collection-items-request-body)

application/json

idsToDeleteIDs to Delete

IDs of the items to delete from the collection.

Array Item

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#delete-collection-items-response-body)

200

Items deleted successfully

itemsDeleted Item IDs

Array of successfully deleted item IDs

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X DELETE "https://connect.craft.do/links/55aNSaGAKqn/api/v1/collections/{collectionId}/items" \
  -H "Content-Type: application/json" \
  -d '{
    "idsToDelete": [
      "1",
      "2"
    ]
  }'
```

200

```
{
  "items": [
    {
      "id": "string"
    }
  ]
}
```

## [Update Collection Items](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-collection-items)

PUT

/`collections`/`{collectionId}`/`items`

Send

Authorization

Path

Body

### [Summary](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-collection-items-summary)

Update existing items in a specific collection.

### [Authorization](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-collection-items-authorization)

bearerAuth

AuthorizationBearer <token>

API key authentication. Use your API key as the Bearer token.

In: `header`

### [Path Parameters](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-collection-items-path-parameters)

collectionIdstring

The unique ID of the collection

### [Request Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-collection-items-request-body)

application/json

itemsToUpdateItems to Update

Items to update in the collection.

Array Item

### [Response Body](https://connect.craft.do/link/55aNSaGAKqn/docs/v1#update-collection-items-response-body)

200

Items updated successfully

itemsSuccessfully Updated Items

Array of successfully updated items

Array Item

Server URL

https://connect.craft.do/links/55aNSaGAKqn/api/v1

cURL

JavaScript

Go

Python

Java

C#

```
curl -X PUT "https://connect.craft.do/links/55aNSaGAKqn/api/v1/collections/{collectionId}/items" \
  -H "Content-Type: application/json" \
  -d '{
    "itemsToUpdate": [
      {
        "id": "string"
      }
    ]
  }'
```

200

```
{
  "items": [
    {
      "title": "Title 1",
      "properties": {}
    }
  ]
}
```

The editor server implements a backend agnostic API for reading and updating
files and directories. This is an informal specification of the implementation.
It is influenced by WEBDAV and the Dropbox API.

Concepts
========

Versioning is handled by passing around references to a `revisionId`. Whenever a file is 
read, the current `revisionId` is also returned. Everytime a file is updated, the `revisionId`
changes. The `revisionId` may be any string and need not increment in any predictable way.
All it tells us is that two versions differ.

In the rest of this document `baseUrl` refers to the Url that the files are accessed at.
At the moment it is just `/files` but it will differ between users and projects when 
support for these is added.

In all requests the following status codes have meaning:

  * 200 - Success. The request did what was expected.
  * 401 - Authentication failure. Probably due to an expired token for accessing the backend.

Many other status codes can be returned so the client should be prepared to deal with
them sensibly.

API
===

Reading Files
-------------

**Url:** `{baseUrl}/{filePath}` - `GET`

**Parameters:** `filePath` is the path of the file to read.

**Returns:** The body of the request contains the file content. The following headers are set:

  * `X-Revision-Id` - The `revisionId` of the current version of the file just read.
  * `Content-Type` - The mimetype of the file just read.
  * `X-Icon` - The icon to use for this file (from Dropbox).

**Status:**

  * 404 - The file does not exist.

Writing Files
-------------

**Url:** `{baseUrl}/{filePath}` - `PUT`

**Parameters:** `filePath` is the path of the file to read. The following headers are understood:

  * `X-Revision-Id` - The `revisionId` that this edit has been based on.

**Returns:** The body of the request is blank. The following headers are set:

  * `X-Revision-Id` - The `revisionId` of the latest version of the file.
  * `Content-Type` - The mimetype of the file just saved.

**Status:**

  * 409 - Conflict. If an `X-Revision-Id` header was sent in the request it did not match the
          latest version of the file. The returned `X-Revision-Id` is the latest version. The file
          was not saved.



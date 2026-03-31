---
layout: single
title: "IDX Privacy"
permalink: /idx/privacy/
classes: wide
footer_variant: idx
---

This IDX Privacy page explains how information is handled across the IDX surfaces currently exposed by Mehrdad Zaker:

- public informational pages on this site, such as [Industry Guidance]({{ '/idx/assistant/' | relative_url }})
- Google-based sign-in and the authenticated website flow on [Login]({{ '/login/' | relative_url }}) and [IDX Dashboard]({{ '/idx/dashboard/' | relative_url }})
- ChatGPT-connected IDX workflows served from the separate IDX backend at [`https://idx.mehrdadzaker.com`](https://idx.mehrdadzaker.com)

These surfaces do not all return or display the same data. Public guidance pages are informational. The website dashboard is the signed-in web interface on this site. ChatGPT-connected IDX and MCP workflows run on the separate backend and return a smaller tool-oriented payload by default.

## Public Guidance Pages

Public IDX pages on this site, including `/idx/assistant/`, can be viewed without signing in to the dashboard. Those pages may still involve normal website request processing such as IP address, browser details, page requests, and basic operational logging.

## Website Sign-In And Dashboard

If you use the website sign-in and dashboard flow on this site, IDX may process:

- your Google account identifier (`sub`) returned during sign-in
- your Google-verified email address
- your Google profile name
- your Google profile image URL
- the `mdz_session` cookie used to maintain authenticated website access
- uploaded PDF files and the text, extracted structure, limited metadata needed to index and retrieve documents, and job-state records derived from those files
- dashboard searches, document selections, viewer links, and related workflow actions inside the website dashboard

Website session checks on this site are minimized to the authenticated-state information needed for the credentialed web flow. The separate MCP/backend surface still returns its own smaller tool-oriented payloads.

## ChatGPT And MCP Workflows

IDX can also connect document workflows to ChatGPT through MCP on the separate backend at [`https://idx.mehrdadzaker.com`](https://idx.mehrdadzaker.com). That surface may process uploaded files, document IDs, workspace IDs, search requests, citations, excerpts, viewer links, and related workflow state needed to answer the user’s request.

By design, ChatGPT/MCP tool responses are narrower than the website dashboard view. They are intended to return only the fields needed for the user’s request and follow-up actions, rather than the broader dashboard-oriented document payload.

## Information IDX May Process

IDX may process:

- account information returned during website sign-in, such as Google account identifier, verified email address, name, and profile image
- uploaded PDF files and the text, limited metadata needed for indexing and retrieval, extracted structure, and job-state records derived from those files
- search queries, document selections, viewer links, and other actions taken inside IDX pages, the website dashboard, or ChatGPT-connected IDX workflows
- technical and operational logs such as IP address, browser details, request timing, and error events

## How IDX Uses Information

IDX uses information to:

- render public informational IDX pages
- authenticate access to the website dashboard and maintain signed-in sessions
- store, parse, index, and search uploaded PDFs
- generate viewer links and support source-backed document review
- monitor reliability, performance, abuse, and operational errors
- improve product quality, workflow design, and support response

## Uploaded Documents

Files uploaded into IDX are processed so they can be indexed, searched, and referenced inside the viewer workflow. That may include text extraction, metadata handling, job-state tracking, and storage needed to keep document workflows operational.

Do not upload confidential, regulated, export-controlled, or highly sensitive material unless you have confirmed that IDX is the right environment for that use.

## Sessions, Cookies, and Access Control

If you sign in to use the website dashboard, IDX may store authenticated session state in your browser. Session and security controls may use cookies or similar browser storage to keep access-controlled features working and to reduce abuse. The current website sign-in flow uses Google Identity Services plus the `mdz_session` cookie.

## Search, Logs, and Operational Records

IDX may retain search requests, upload events, document status history, viewer access events, and error logs for security, debugging, product support, and service improvement. Those records may include enough context to diagnose failures in upload, indexing, or document retrieval flows.

## Service Providers

IDX may rely on third-party infrastructure, storage, authentication, hosting, analytics, Google sign-in, and model providers to operate uploads, indexing, search, viewer-linked workflows, and ChatGPT-connected IDX behavior. Those providers process data only as needed to run the service.

## Retention

Information is retained for as long as reasonably necessary to operate IDX, maintain security, support users, comply with legal obligations, and investigate operational issues. Retention may vary based on document workflow needs, support history, or system requirements.

## Your Choices

You may:

- avoid signing in if you do not want to use authenticated IDX features
- use public informational IDX pages without signing in to the dashboard
- refrain from uploading documents that are not appropriate for this environment
- contact us with privacy-related questions or requests where legally available

## Changes

This page may be updated as IDX changes. The latest version will be posted here.

**Effective date:** March 31, 2026

## Contact

For IDX privacy questions, contact [{{ site.contact_email }}](mailto:{{ site.contact_email }}) or use the [IDX Support]({{ '/idx/support/' | relative_url }}) page.

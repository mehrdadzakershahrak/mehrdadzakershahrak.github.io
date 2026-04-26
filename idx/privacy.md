---
layout: single
title: "IDX Privacy"
permalink: /idx/privacy/
classes: wide
footer_variant: idx
---

This IDX Privacy page explains how information is handled across the IDX surfaces currently exposed by Mehrdad Zaker:

- public informational pages on this site, such as [Product Catalogue]({{ '/products/' | relative_url }}) and [IDX]({{ '/products/idx/' | relative_url }})
- redirect and handoff pages on this site, such as [Login]({{ '/login/' | relative_url }}) and [IDX Dashboard]({{ '/idx/dashboard/' | relative_url }})
- the separate IDX application, authentication, and ChatGPT-connected workflows served from [`https://idx.mehrdadzaker.com`](https://idx.mehrdadzaker.com)

These surfaces do not all return or display the same data. Public site pages are informational. The `/login/` and `/idx/dashboard/` pages on this site act as handoff pages into the separate IDX host. Authenticated uploads, indexing, search, viewer access, and ChatGPT-connected IDX/MCP workflows run on the separate IDX host and may return narrower task-oriented payloads where appropriate.

## Public IDX Pages

Public IDX pages on this site, including `/products/idx/`, can be viewed without signing in. Those pages may still involve normal website request processing such as IP address, browser details, page requests, and basic operational logging.

## Handoff Pages On This Site

If you use the `/login/` or `/idx/dashboard/` pages on this site, IDX may process:

- request details needed to serve the handoff page or redirect
- query parameters or return URLs needed to complete the redirect into the live IDX portal
- standard operational logging needed to troubleshoot redirect, availability, or routing problems

These handoff pages do not host the authenticated IDX workspace themselves. Document uploads, searches, viewer-linked review, and related authenticated workflows run on the separate IDX host.

## IDX App, Authentication, And MCP Workflows

IDX can connect document workflows to the separate IDX application and to ChatGPT through MCP on [`https://idx.mehrdadzaker.com`](https://idx.mehrdadzaker.com). That surface may process account information returned during sign-in, uploaded files, document IDs, workspace IDs, search requests, citations, excerpts, viewer links, and related workflow state needed to answer the user’s request.

By design, ChatGPT/MCP tool responses may be narrower than the full IDX application view. They are intended to return only the fields needed for the user’s request and follow-up actions.

## Information IDX May Process

IDX may process:

- account information returned during IDX sign-in, such as Google account identifier, verified email address, name, and profile image
- uploaded PDF files and the text, limited metadata needed for indexing and retrieval, extracted structure, and job-state records derived from those files
- search queries, document selections, viewer links, and other actions taken inside the IDX app or ChatGPT-connected IDX workflows
- technical and operational logs such as IP address, browser details, request timing, error events, and redirect flow diagnostics

## How IDX Uses Information

IDX uses information to:

- render public informational IDX pages
- hand off users from this site into the live IDX portal
- authenticate access to the IDX application and maintain signed-in sessions
- store, parse, index, and search uploaded PDFs on the IDX host
- generate viewer links and support source-backed document review
- monitor reliability, performance, abuse, and operational errors
- improve product quality, workflow design, and support response

## Uploaded Documents

Files uploaded into IDX are processed so they can be indexed, searched, and referenced inside the viewer workflow. That may include text extraction, metadata handling, job-state tracking, and storage needed to keep document workflows operational.

Do not upload confidential, regulated, export-controlled, or highly sensitive material unless you have confirmed that IDX is the right environment for that use.

## Sessions, Cookies, and Access Control

If you sign in to use IDX, authenticated session state may be stored in your browser. Session and security controls may use cookies or similar browser storage to keep access-controlled features working and to reduce abuse. The current website pages at `/login/` and `/idx/dashboard/` are handoff pages; authenticated product access is handled on the separate IDX host.

## Search, Logs, and Operational Records

IDX may retain search requests, upload events, document status history, viewer access events, and error logs for security, debugging, product support, and service improvement. Those records may include enough context to diagnose failures in upload, indexing, or document retrieval flows.

## Service Providers

IDX may rely on third-party infrastructure, storage, authentication, hosting, analytics, Google sign-in, and model providers to operate uploads, indexing, search, viewer-linked workflows, and ChatGPT-connected IDX behavior. Those providers process data only as needed to run the service.

## Retention

Information is retained for as long as reasonably necessary to operate IDX, maintain security, support users, comply with legal obligations, and investigate operational issues. Retention may vary based on document workflow needs, support history, or system requirements.

## Your Choices

You may:

- avoid signing in if you do not want to use authenticated IDX features
- use public informational IDX pages without signing in to the live product
- refrain from uploading documents that are not appropriate for this environment
- contact us with privacy-related questions or requests where legally available

## Changes

This page may be updated as IDX changes. The latest version will be posted here.

**Effective date:** April 11, 2026

## Contact

For IDX privacy questions, contact [{{ site.contact_email }}](mailto:{{ site.contact_email }}) or use the [IDX Support]({{ '/idx/support/' | relative_url }}) page.

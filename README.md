# Stash - A Cloudflare-native Pastebin

Stash is a pastebin application running entirely on Cloudflare Workers, using Durable Objects for storage and Vectorize for semantic search.

## Motivation

I often find myself needing to share code snippets, but I'm hesitant to use public pastebins because I have to meticulously redact API keys and other sensitive information. So I made one for myself...

## Features

- **Public & Private Pastes**: Works in public mode by default. Can be configured for private pastes tied to Google accounts.
- **Semantic Search**: Find pastes based on meaning, not just keywords.
- **Syntax Highlighting**: Code pastes are beautifully highlighted using Highlight.js.
- **One-Click Deploy**: Deploy the entire application with a single click.

## One-Click Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/roerohan/stash)

## Architecture

This tool runs on Cloudflare's serverless platform (Workers, Durable Objects, etc.) instead of a traditional server and database. This provides:

- **Global Low-Latency**: Fast access from anywhere in the world.
- **Simplified Infrastructure**: No servers or databases for you to manage.

## Usage Instructions

1.  **Deploy**: Click the "Deploy to Cloudflare" button above. The application will be deployed and will run in public mode.
2.  **(Optional) Configure Cloudflare Access for Private Mode**:
    *   Go to your Cloudflare Dashboard -> Zero Trust.
    *   Under `Settings` -> `Authentication`, add Google as a login method.
    *   Go to `Access` -> `Applications` and add a new `Self-hosted` application.
    *   Set the application domain to your Worker's domain.
    *   Create a policy to require Google login.
    *   Once configured, the Worker will receive the `cf-access-authenticated-user-email` header, and the app will support private pastes.

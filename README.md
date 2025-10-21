# Stash - A Cloudflare-native Pastebin

Stash is a pastebin application running entirely on Cloudflare Workers, using Durable Objects for storage and Vectorize for semantic search.

## Features

- **Public & Private Pastes**: Works in public mode by default. Can be configured for private pastes tied to Google accounts.
- **Semantic Search**: Find pastes based on meaning, not just keywords.
- **Syntax Highlighting**: Code pastes are beautifully highlighted using Highlight.js.
- **One-Click Deploy**: Deploy the entire application with a single click.

## One-Click Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/roerohan/stash)

## Usage Instructions

1.  **Deploy**: Click the "Deploy to Cloudflare" button above. The application will be deployed and will run in public mode.
2.  **(Optional) Configure Cloudflare Access for Private Mode**:
    *   Go to your Cloudflare Dashboard -> Zero Trust.
    *   Under `Settings` -> `Authentication`, add Google as a login method.
    *   Go to `Access` -> `Applications` and add a new `Self-hosted` application.
    *   Set the application domain to your Worker's domain.
    *   Create a policy to require Google login.
    *   Once configured, the Worker will receive the `cf-access-authenticated-user-email` header, and the app will support private pastes.

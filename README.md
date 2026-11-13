# React + Vite

## Gemini model selection

The backend defaults to application-level Auto mode for both resume and cover-letter
generation. Configure these optional values in `../backend/.env`:

```dotenv
GEMINI_MODEL=auto
GEMINI_AUTO_MODELS=gemini-3.8-flash,gemini-3.6-flash
```

Auto tries the listed models in order. Each model gets at most three application-level
attempts on HTTP 503 (busy/unavailable), with 1- and 2-second retry delays,
before moving to the next model. The SDK may also perform its own retries.
The literal `auto` is never sent as a model ID to Google.
Other errors, including authentication, invalid model IDs, and quota/rate-limit
errors (429), fail immediately without application-level retries or fallback.
If every candidate is busy, the backend returns HTTP 503.

To disable fallback, set `GEMINI_MODEL` to a specific Gemini model ID. That model
still receives the same busy-error retries. Restart the backend after changing
configuration. Candidates must be text-generation models available to your API
key; fallback models may differ in output quality, pricing, and quotas. Auto
can improve availability but does not guarantee it. Cached outputs are reused
regardless of model configuration; use a new input or edit the prompts to
exercise model selection.

Run the mocked backend tests without making API calls:

```sh
cd ../backend
venv/bin/python -m unittest -v test_model_selection
```

## Backend prompts

Both resume and cover-letter system instructions and user prompt templates live
in [`../backend/prompts.py`](../backend/prompts.py). Edit that module to change
the prompts, then restart the backend. User templates use `{master_resume_text}`
and `{target_context}` placeholders; write literal braces in template text as
`{{` and `}}`. Braces in uploaded resume text or job context need no escaping.
Cached outputs are keyed by the prompt text, so editing a prompt automatically
generates fresh output for previously cached inputs.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

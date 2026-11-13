# Local Gemini Resume & Cover Letter Tailor

A full-stack web application that parses a master PDF resume, extracts job descriptions from pasted text or URLs, and generates ATS-optimized Markdown resumes and cover letters using the Google Gemini API[cite: 1, 3, 6].

---

## Architecture & Project Structure

The frontend sends `multipart/form-data` requests (`resume_file`, `jd_source`, and optional `additional_context`) directly to the FastAPI backend on `http://127.0.0.1:8000`. **The backend must be running first** for the frontend to process requests.

```text
Resume Builder/
├── backend/                      # Python FastAPI server (must start first)
│   ├── main.py                   # API endpoints, PDF parsing, caching, and model fallback
│   ├── prompts.py                # System instructions and prompt templates
│   ├── mainShell.py              # Legacy single-endpoint prototype
│   ├── test_model_selection.py   # Mocked unit tests for retry, fallback, and caching
│   ├── .env                      # Local API key and model config (not tracked in Git)
│   └── cache/                    # Auto-generated JSON cache for PDFs & outputs
└── frontend/                     # React 19 + Vite web UI
    ├── index.html                # Entry HTML
    ├── package.json              # Scripts and dependencies (React, Vite, jsPDF, html2canvas)
    ├── vite.config.js            # Vite configuration
    └── src/
        ├── main.jsx              # React root mount
        ├── App.jsx               # Upload form, API client, Markdown preview, Copy & Download
        ├── App.css               # Component styles
        └── index.css             # Global theme & layout styles


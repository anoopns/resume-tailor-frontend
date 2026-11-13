import { useState } from 'react';

const formatInline = (text) => {
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={`${token}-${index}`}>{token.slice(2, -2)}</strong>;
    }

    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={`${token}-${index}`}>{token.slice(1, -1)}</em>;
    }

    return <span key={`${token}-${index}`}>{token}</span>;
  });
};

const renderMarkdown = (markdown) => {
  const lines = markdown.split('\n');
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(
        <ul key={`list-${blocks.length}`} style={{ margin: '0.75rem 0 1rem 1.25rem', padding: 0, color: '#111827' }}>
          {listItems.map((item, index) => (
            <li key={`${item}-${index}`} style={{ marginBottom: '0.35rem', lineHeight: 1.5, color: '#111827' }}>{formatInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(
        <h3 key={`h3-${index}`} style={{ margin: '1.1rem 0 0.35rem', color: '#111827', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.02em' }}>
          {formatInline(trimmed.replace(/^###\s*/, ''))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(
        <h2 key={`h2-${index}`} style={{ margin: '1.4rem 0 0.5rem', color: '#111827', fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid #d1d5db', paddingBottom: '0.2rem' }}>
          {formatInline(trimmed.replace(/^##\s*/, ''))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push(
        <h1 key={`h1-${index}`} style={{ margin: '0 0 0.5rem', fontSize: '2rem', color: '#111827', lineHeight: 1.2, fontWeight: 700 }}>
          {formatInline(trimmed.replace(/^#\s*/, ''))}
        </h1>
      );
      return;
    }

    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.replace(/^-\s*/, ''));
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${index}`} style={{ margin: '0.25rem 0', lineHeight: 1.6, color: '#1f2937' }}>
        {formatInline(trimmed)}
      </p>
    );
  });

  flushList();
  return blocks;
};

const normalizeResumeText = (markdown) => markdown.replace(/\r\n/g, '\n').trim();

function App() {
  const [file, setFile] = useState(null);
  const [jdSource, setJdSource] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [markdownResult, setMarkdownResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [outputType, setOutputType] = useState('resume');

  const handleDownload = () => {
    if (!markdownResult) return;

    const safeText = normalizeResumeText(markdownResult);
    const blob = new Blob([safeText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tailored-resume.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!markdownResult) return;

    try {
      await navigator.clipboard.writeText(normalizeResumeText(markdownResult));
      alert(outputType === 'cover-letter' ? 'Cover letter copied to clipboard.' : 'Resume copied to clipboard.');
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Copy failed. Please download the file instead.');
    }
  };

  const submitTailoringRequest = async (mode) => {
    if (!file || !jdSource.trim()) {
      alert('Please upload a PDF resume and provide a Job Description.');
      return;
    }

    setLoading(true);
    setMarkdownResult('');
    setErrorMessage('');
    setOutputType(mode);

    const formData = new FormData();
    formData.append('resume_file', file);
    formData.append('jd_source', jdSource);
    if (additionalContext.trim()) {
      formData.append('additional_context', additionalContext.trim());
    }

    try {
      const endpoint = mode === 'cover-letter' ? 'http://127.0.0.1:8000/api/tailor-cover-letter' : 'http://127.0.0.1:8000/api/tailor-resume';
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errorData = {};
        try {
          errorData = await res.json();
        } catch {
          errorData = { detail: 'Server returned an error without JSON.' };
        }
        throw new Error(errorData.detail || `Failed to generate tailored ${mode === 'cover-letter' ? 'cover letter' : 'resume'}.`);
      }

      const data = await res.json();
      setMarkdownResult(data.markdown);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const lower = message.toLowerCase();
      const userMessage = lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')
        ? 'Gemini is temporarily busy. Please try again in a few moments.'
        : message;

      setErrorMessage(userMessage);
      console.error(`${mode === 'cover-letter' ? 'Cover letter' : 'Resume'} tailoring failed:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitTailoringRequest('resume');
  };

  const handleCoverLetterSubmit = async (e) => {
    e.preventDefault();
    await submitTailoringRequest('cover-letter');
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
        <h2>Local Gemini Resume Tailor</h2>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
            Master Resume (PDF):
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
            Target Job Description (Paste Text or URL):
          </label>
          <textarea
            rows="5"
            style={{ width: '100%', padding: '0.5rem' }}
            value={jdSource}
            onChange={(e) => setJdSource(e.target.value)}
            placeholder="Paste raw JD text OR enter job post URL (e.g., https://example.com/job)..."
            required
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
            Additional Context (Optional):
          </label>
          <textarea
            rows="4"
            style={{ width: '100%', padding: '0.5rem' }}
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Examples: role-specific strengths, career goals, company values, key achievements, or hiring manager notes"
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '0.75rem',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: loading ? '#6b7280' : '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading && (
              <span
                aria-label="Loading"
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.5)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            )}
            {loading ? 'Tailoring Resume...' : 'Generate Tailored Resume'}
          </button>

          <button
            type="button"
            onClick={handleCoverLetterSubmit}
            disabled={loading}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '0.75rem',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: loading ? '#6b7280' : '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? 'Writing Cover Letter...' : 'Generate Cover Letter'}
          </button>
        </div>
      </form>

      {loading && (
        <div style={{ marginTop: '1rem', color: '#374151', fontSize: '0.95rem' }}>
          {outputType === 'cover-letter' ? 'Preparing a tailored cover letter...' : 'Processing your resume against the job description...'}
        </div>
      )}

      {errorMessage && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', border: '1px solid #fecaca' }}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {markdownResult && (
        <div style={{ marginTop: '2rem', borderTop: '2px solid #2a2d35', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: '#f3f4f6' }}>
              {outputType === 'cover-letter' ? 'Tailored Cover Letter Preview' : 'Tailored Resume Preview'}
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.65rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                Copy
              </button>
              <button
                type="button"
                onClick={handleDownload}
                style={{
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.65rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                Download Resume (.md)
              </button>
            </div>
          </div>

          <div
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '1.5rem 1.75rem',
              textAlign: 'left',
              color: '#111827',
              boxSizing: 'border-box',
              lineHeight: 1.7,
              maxWidth: '100%',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            {renderMarkdown(normalizeResumeText(markdownResult))}
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export default App;

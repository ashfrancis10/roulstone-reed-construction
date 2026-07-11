const REPO = 'ashfrancis10/roulstone-reed-construction';
const LIVE_URL = 'https://roulstone-reed-construction.ashfrancis10.workers.dev/';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function checkAuth(request, env) {
  const pw = request.headers.get('X-Admin-Password') || '';
  const expected = env.ADMIN_PASSWORD || 'password';
  return pw === expected;
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function githubRequest(path, token, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'roulstone-reed-worker',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `GitHub API error ${res.status}`);
  }
  return res.json();
}

async function getFileSha(filePath, token) {
  try {
    const data = await githubRequest(`/repos/${REPO}/contents/${filePath}`, token);
    return data.sha;
  } catch {
    return null;
  }
}

async function commitFile(filePath, content, message, token) {
  const sha = await getFileSha(filePath, token);
  const body = {
    message,
    content: toBase64(content),
    ...(sha ? { sha } : {}),
  };
  return githubRequest(`/repos/${REPO}/contents/${filePath}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function commitBinary(filePath, bytes, message, token) {
  const sha = await getFileSha(filePath, token);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const body = {
    message,
    content: btoa(binary),
    ...(sha ? { sha } : {}),
  };
  return githubRequest(`/repos/${REPO}/contents/${filePath}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function handleContentSave(request, env) {
  if (!checkAuth(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!env.GITHUB_TOKEN) {
    return json({ error: 'GitHub token not configured on Cloudflare' }, 500);
  }

  const raw = await request.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!data.meta) {
    return json({ error: 'Invalid content: missing meta section' }, 400);
  }

  const formatted = JSON.stringify(data, null, 2) + '\n';
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const message = `Update site content from editor (${stamp})`;

  try {
    await commitFile('content.json', formatted, message, env.GITHUB_TOKEN);
    return json({
      ok: true,
      saved: true,
      published: true,
      message: 'Published - live site updates in 1-2 minutes',
      liveSiteUrl: LIVE_URL,
    });
  } catch (err) {
    return json({
      ok: true,
      saved: false,
      published: false,
      publishError: err.message,
      message: 'GitHub commit failed',
    }, 500);
  }
}

async function handleImageUpload(request, env) {
  if (!checkAuth(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!env.GITHUB_TOKEN) {
    return json({ error: 'GitHub token not configured on Cloudflare' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const safeName = String(payload.filename || 'upload.jpg')
    .split(/[/\\]/).pop()
    .replace(/[^a-zA-Z0-9._-]/g, '-') || 'upload.jpg';
  const webPath = `images/${safeName}`;

  try {
    const bytes = fromBase64(payload.data || '');
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await commitBinary(webPath, bytes, `Upload image from editor (${stamp})`, env.GITHUB_TOKEN);
    return json({ path: webPath });
  } catch (err) {
    return json({ error: err.message || 'Upload failed' }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json({
        ok: true,
        editor: true,
        github: Boolean(env.GITHUB_TOKEN),
      });
    }

    if (url.pathname === '/api/content' && request.method === 'POST') {
      return handleContentSave(request, env);
    }

    if (url.pathname === '/api/upload-image' && request.method === 'POST') {
      return handleImageUpload(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
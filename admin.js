(function () {
  const AUTH_KEY = 'rr_admin_auth';
  const DEFAULT_PASSWORD = 'password';
  let content = null;
  let adminPassword = DEFAULT_PASSWORD;
  let configReady = false;
  let serverAvailable = false;

  const loginScreen = document.getElementById('login-screen');
  const editor = document.getElementById('editor');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('btn-login');
  const contentForm = document.getElementById('content-form');
  const saveStatus = document.getElementById('save-status');
  const serverBanner = document.getElementById('server-banner');

  function getAuthHeader() {
    return { 'X-Admin-Password': sessionStorage.getItem(AUTH_KEY) || '' };
  }

  function field(label, id, value, type = 'text') {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const lbl = document.createElement('label');
    lbl.htmlFor = id;
    lbl.textContent = label;
    wrap.appendChild(lbl);
    if (type === 'textarea') {
      const ta = document.createElement('textarea');
      ta.id = id;
      ta.name = id;
      ta.value = value || '';
      wrap.appendChild(ta);
    } else {
      const inp = document.createElement('input');
      inp.type = type;
      inp.id = id;
      inp.name = id;
      inp.value = value || '';
      wrap.appendChild(inp);
    }
    return wrap;
  }

  function imageField(label, id, value) {
    const wrap = document.createElement('div');
    wrap.className = 'field image-field';
    const lbl = document.createElement('label');
    lbl.htmlFor = id;
    lbl.textContent = label;
    wrap.appendChild(lbl);

    const preview = document.createElement('img');
    preview.className = 'preview';
    preview.alt = '';
    preview.onerror = () => { preview.classList.add('preview-broken'); };
    if (value) preview.src = value;

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.id = id;
    urlInput.name = id;
    urlInput.value = value || '';
    urlInput.placeholder = 'Image URL or upload below';
    urlInput.addEventListener('input', () => {
      preview.classList.remove('preview-broken');
      preview.src = urlInput.value;
    });

    const uploadRow = document.createElement('div');
    uploadRow.className = 'upload-row';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      if (!serverAvailable) {
        setStatus('Start start.bat before uploading images.', 'err');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              data: reader.result.split(',')[1],
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          urlInput.value = data.path;
          preview.classList.remove('preview-broken');
          preview.src = data.path;
          setStatus('Image uploaded.', 'ok');
        } catch (err) {
          setStatus(err.message || 'Upload failed. Run start.bat and try again.', 'err');
        }
      };
      reader.readAsDataURL(file);
    });
    uploadRow.appendChild(fileInput);
    wrap.appendChild(preview);
    wrap.appendChild(urlInput);
    wrap.appendChild(uploadRow);
    return wrap;
  }

  function section(title) {
    const el = document.createElement('section');
    el.className = 'section';
    const h2 = document.createElement('h2');
    h2.textContent = title;
    el.appendChild(h2);
    return el;
  }

  function buildForm() {
    contentForm.innerHTML = '';
    const c = content;
    if (!c) return;

    const sMeta = section('Site');
    sMeta.appendChild(field('Page title', 'meta.title', c.meta?.title));
    sMeta.appendChild(field('Meta description', 'meta.description', c.meta?.description, 'textarea'));
    contentForm.appendChild(sMeta);

    const sHero = section('Hero');
    sHero.appendChild(field('Headline', 'hero.title', c.hero?.title));
    sHero.appendChild(field('Kicker', 'hero.kicker', c.hero?.kicker));
    sHero.appendChild(field('Tagline', 'hero.tagline', c.hero?.tagline, 'textarea'));
    sHero.appendChild(imageField('Background image', 'hero.image', c.hero?.image));
    contentForm.appendChild(sHero);

    const sHeroImg = section('Hero image');
    sHeroImg.appendChild(imageField('Image', 'heroImage.src', c.heroImage?.src));
    sHeroImg.appendChild(field('Alt text', 'heroImage.alt', c.heroImage?.alt));
    contentForm.appendChild(sHeroImg);

    const sAbout = section('About');
    sAbout.appendChild(field('Heading', 'about.title', c.about?.title));
    sAbout.appendChild(field('Text', 'about.text', c.about?.text, 'textarea'));
    sAbout.appendChild(field('Button', 'about.button', c.about?.button));
    contentForm.appendChild(sAbout);

    const sServices = section('Services');
    sServices.appendChild(field('Kicker', 'services.kicker', c.services?.kicker));
    sServices.appendChild(field('Text', 'services.text', c.services?.text, 'textarea'));
    sServices.appendChild(field('Button', 'services.button', c.services?.button));
    (c.services?.items || []).forEach((item, i) => {
      const sub = document.createElement('div');
      sub.className = 'subsection';
      const h3 = document.createElement('h3');
      h3.textContent = 'Service ' + (i + 1);
      sub.appendChild(h3);
      sub.appendChild(field('Title', 'services.items.' + i + '.title', item.title));
      sub.appendChild(imageField('Image', 'services.items.' + i + '.image', item.image));
      sServices.appendChild(sub);
    });
    contentForm.appendChild(sServices);

    const sShow = section('Our approach');
    sShow.appendChild(field('Kicker', 'showroom.kicker', c.showroom?.kicker));
    sShow.appendChild(field('Title', 'showroom.title', c.showroom?.title, 'textarea'));
    sShow.appendChild(field('Address label', 'showroom.addressLabel', c.showroom?.addressLabel));
    sShow.appendChild(field('Address', 'showroom.address', c.showroom?.address));
    sShow.appendChild(imageField('Background image', 'showroom.image', c.showroom?.image));
    contentForm.appendChild(sShow);

    const sProj = section('Projects');
    sProj.appendChild(field('Kicker', 'projects.kicker', c.projects?.kicker));
    sProj.appendChild(field('Intro', 'projects.intro', c.projects.intro, 'textarea'));
    sProj.appendChild(field('Button', 'projects.button', c.projects?.button));
    (c.projects?.items || []).forEach((item, i) => {
      const sub = document.createElement('div');
      sub.className = 'subsection';
      const h3 = document.createElement('h3');
      h3.textContent = 'Project ' + (i + 1);
      sub.appendChild(h3);
      sub.appendChild(field('Name', 'projects.items.' + i + '.name', item.name));
      sub.appendChild(field('Tags', 'projects.items.' + i + '.tags', item.tags));
      sub.appendChild(imageField('Preview image', 'projects.items.' + i + '.image', item.image));
      sProj.appendChild(sub);
    });
    contentForm.appendChild(sProj);

    const sDuo = section('Gallery duo');
    sDuo.appendChild(imageField('Image left', 'duo.imageA', c.duo?.imageA));
    sDuo.appendChild(imageField('Image right', 'duo.imageB', c.duo?.imageB));
    contentForm.appendChild(sDuo);

    const sStories = section('Client stories');
    sStories.appendChild(field('Kicker', 'stories.kicker', c.stories?.kicker));
    (c.stories?.items || []).forEach((item, i) => {
      const sub = document.createElement('div');
      sub.className = 'subsection';
      const h3 = document.createElement('h3');
      h3.textContent = 'Story ' + (i + 1);
      sub.appendChild(h3);
      sub.appendChild(field('Quote', 'stories.items.' + i + '.quote', item.quote, 'textarea'));
      sub.appendChild(field('Name', 'stories.items.' + i + '.name', item.name));
      sub.appendChild(field('Role', 'stories.items.' + i + '.role', item.role));
      sub.appendChild(imageField('Headshot', 'stories.items.' + i + '.image', item.image));
      sStories.appendChild(sub);
    });
    contentForm.appendChild(sStories);

    const sContact = section('Contact');
    sContact.appendChild(field('Heading', 'contact.title', c.contact?.title));
    sContact.appendChild(field('Text', 'contact.text', c.contact?.text, 'textarea'));
    sContact.appendChild(field('Primary button', 'contact.buttonPrimary', c.contact?.buttonPrimary));
    sContact.appendChild(field('Secondary button', 'contact.buttonSecondary', c.contact?.buttonSecondary));
    sContact.appendChild(field('Email', 'contact.email', c.contact?.email));
    contentForm.appendChild(sContact);

    const sFooter = section('Footer');
    sFooter.appendChild(field('Copyright', 'footer.copyright', c.footer?.copyright));
    sFooter.appendChild(field('Instagram URL', 'footer.instagramUrl', c.footer?.instagramUrl));
    sFooter.appendChild(field('Instagram label', 'footer.instagramLabel', c.footer?.instagramLabel));
    contentForm.appendChild(sFooter);
  }

  function setNested(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      const next = keys[i + 1];
      if (/^\d+$/.test(next)) {
        if (!cur[k]) cur[k] = [];
        cur = cur[k];
        i++;
        const idx = parseInt(keys[i], 10);
        if (!cur[idx]) cur[idx] = {};
        cur = cur[idx];
      } else {
        if (!cur[k]) cur[k] = {};
        cur = cur[k];
      }
    }
    cur[keys[keys.length - 1]] = value;
  }

  function collectFormData() {
    const data = JSON.parse(JSON.stringify(content));
    contentForm.querySelectorAll('input, textarea').forEach((el) => {
      if (!el.name || el.type === 'file') return;
      setNested(data, el.name, el.value);
    });
    return data;
  }

  function setStatus(msg, type) {
    saveStatus.textContent = msg;
    saveStatus.className = 'save-status ' + (type || '');
  }

  function updateServerBanner() {
    if (!serverBanner) return;
    if (serverAvailable) {
      serverBanner.textContent = 'Server connected — Save and image upload are enabled.';
      serverBanner.className = 'server-banner ok';
    } else {
      serverBanner.textContent = 'Local server not detected. Run start.bat, then refresh. You can still edit and use Download JSON.';
      serverBanner.className = 'server-banner warn';
    }
  }

  async function checkServer() {
    try {
      const res = await fetch('/api/health', { method: 'GET' });
      serverAvailable = res.ok;
    } catch {
      serverAvailable = false;
    }
    updateServerBanner();
  }

  async function loadConfig() {
    try {
      const res = await fetch('admin-config.json?' + Date.now());
      if (!res.ok) throw new Error('Could not load admin config');
      const cfg = await res.json();
      adminPassword = String(cfg.password || DEFAULT_PASSWORD).trim() || DEFAULT_PASSWORD;
    } catch {
      adminPassword = DEFAULT_PASSWORD;
    }
    configReady = true;
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign in';
    }
  }

  async function loadContent() {
    const res = await fetch('content.json?' + Date.now());
    if (!res.ok) throw new Error('Could not load content.json');
    const data = await res.json();
    if (!data || !data.meta) throw new Error('content.json is invalid');
    content = data;
  }

  function showEditor() {
    loginScreen.hidden = true;
    editor.hidden = false;
    buildForm();
  }

  async function enterEditor() {
    try {
      setStatus('Loading content…', '');
      await loadContent();
      await checkServer();
      showEditor();
      setStatus('', '');
    } catch {
      loginError.textContent = 'Could not load content. Run start.bat, then open http://localhost:8080/admin.html';
      loginError.hidden = false;
      sessionStorage.removeItem(AUTH_KEY);
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!configReady) await loadConfig();
    const pw = document.getElementById('login-password').value.trim();
    if (pw !== adminPassword) {
      loginError.textContent = 'Incorrect password. Use: password';
      loginError.hidden = false;
      return;
    }
    sessionStorage.setItem(AUTH_KEY, pw);
    loginError.hidden = true;
    await enterEditor();
  });

  contentForm.addEventListener('submit', (e) => e.preventDefault());

  document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    location.reload();
  });

  document.getElementById('btn-download').addEventListener('click', () => {
    const data = collectFormData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'content.json';
    a.click();
    setStatus('Downloaded content.json — replace the file in the project folder if not using start.bat.', 'ok');
  });

  document.getElementById('btn-import').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data.meta) throw new Error('Invalid content file');
        content = data;
        buildForm();
        setStatus('Content imported. Click Save changes to apply.', 'ok');
      } catch {
        setStatus('Could not read that file. Choose a valid content.json.', 'err');
      }
    });
    input.click();
  });

  document.getElementById('btn-save').addEventListener('click', async () => {
    const data = collectFormData();
    setStatus('Saving…', '');
    if (!serverAvailable) {
      setStatus('Start start.bat to save, or use Download JSON.', 'err');
      return;
    }
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data, null, 2),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Save failed');
      content = data;
      setStatus('Saved. Refresh the main site to see changes.', 'ok');
    } catch (err) {
      setStatus(err.message || 'Could not save. Run start.bat and try again.', 'err');
    }
  });

  async function init() {
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Loading…';
    }
    await loadConfig();

    const stored = sessionStorage.getItem(AUTH_KEY);
    if (stored && stored.trim() === adminPassword) {
      await enterEditor();
    } else if (stored) {
      sessionStorage.removeItem(AUTH_KEY);
    }
  }

  init();
})();
(function () {
  const AUTH_KEY = 'rr_admin_auth';
  let content = null;
  let adminPassword = '';

  const loginScreen = document.getElementById('login-screen');
  const editor = document.getElementById('editor');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const contentForm = document.getElementById('content-form');
  const saveStatus = document.getElementById('save-status');

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
    preview.src = value || '';
    preview.alt = '';
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.id = id;
    urlInput.name = id;
    urlInput.value = value || '';
    urlInput.placeholder = 'Image URL or upload below';
    urlInput.addEventListener('input', () => { preview.src = urlInput.value; });
    const uploadRow = document.createElement('div');
    uploadRow.className = 'upload-row';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
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
          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          urlInput.value = data.path;
          preview.src = data.path;
          setStatus('Image uploaded.', 'ok');
        } catch {
          setStatus('Upload failed. Is the local server running?', 'err');
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

    const sMeta = section('Site');
    sMeta.appendChild(field('Page title', 'meta.title', c.meta.title));
    sMeta.appendChild(field('Meta description', 'meta.description', c.meta.description, 'textarea'));
    contentForm.appendChild(sMeta);

    const sHero = section('Hero');
    sHero.appendChild(field('Headline', 'hero.title', c.hero.title));
    sHero.appendChild(field('Kicker', 'hero.kicker', c.hero.kicker));
    sHero.appendChild(field('Tagline', 'hero.tagline', c.hero.tagline, 'textarea'));
    sHero.appendChild(imageField('Background image', 'hero.image', c.hero.image));
    contentForm.appendChild(sHero);

    const sHeroImg = section('Hero image');
    sHeroImg.appendChild(imageField('Image', 'heroImage.src', c.heroImage.src));
    sHeroImg.appendChild(field('Alt text', 'heroImage.alt', c.heroImage.alt));
    contentForm.appendChild(sHeroImg);

    const sAbout = section('About');
    sAbout.appendChild(field('Heading', 'about.title', c.about.title));
    sAbout.appendChild(field('Text', 'about.text', c.about.text, 'textarea'));
    sAbout.appendChild(field('Button', 'about.button', c.about.button));
    contentForm.appendChild(sAbout);

    const sServices = section('Services');
    sServices.appendChild(field('Kicker', 'services.kicker', c.services.kicker));
    sServices.appendChild(field('Text', 'services.text', c.services.text, 'textarea'));
    sServices.appendChild(field('Button', 'services.button', c.services.button));
    c.services.items.forEach((item, i) => {
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
    sShow.appendChild(field('Kicker', 'showroom.kicker', c.showroom.kicker));
    sShow.appendChild(field('Title', 'showroom.title', c.showroom.title, 'textarea'));
    sShow.appendChild(field('Address label', 'showroom.addressLabel', c.showroom.addressLabel));
    sShow.appendChild(field('Address', 'showroom.address', c.showroom.address));
    sShow.appendChild(imageField('Background image', 'showroom.image', c.showroom.image));
    contentForm.appendChild(sShow);

    const sProj = section('Projects');
    sProj.appendChild(field('Kicker', 'projects.kicker', c.projects.kicker));
    sProj.appendChild(field('Intro', 'projects.intro', c.projects.intro, 'textarea'));
    sProj.appendChild(field('Button', 'projects.button', c.projects.button));
    c.projects.items.forEach((item, i) => {
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
    sDuo.appendChild(imageField('Image left', 'duo.imageA', c.duo.imageA));
    sDuo.appendChild(imageField('Image right', 'duo.imageB', c.duo.imageB));
    contentForm.appendChild(sDuo);

    const sStories = section('Client stories');
    sStories.appendChild(field('Kicker', 'stories.kicker', c.stories.kicker));
    c.stories.items.forEach((item, i) => {
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
    sContact.appendChild(field('Heading', 'contact.title', c.contact.title));
    sContact.appendChild(field('Text', 'contact.text', c.contact.text, 'textarea'));
    sContact.appendChild(field('Primary button', 'contact.buttonPrimary', c.contact.buttonPrimary));
    sContact.appendChild(field('Secondary button', 'contact.buttonSecondary', c.contact.buttonSecondary));
    sContact.appendChild(field('Email', 'contact.email', c.contact.email));
    contentForm.appendChild(sContact);

    const sFooter = section('Footer');
    sFooter.appendChild(field('Copyright', 'footer.copyright', c.footer.copyright));
    sFooter.appendChild(field('Instagram URL', 'footer.instagramUrl', c.footer.instagramUrl));
    sFooter.appendChild(field('Instagram label', 'footer.instagramLabel', c.footer.instagramLabel));
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
    const last = keys[keys.length - 1];
    cur[last] = value;
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

  async function loadConfig() {
    const res = await fetch('admin-config.json');
    const cfg = await res.json();
    adminPassword = cfg.password;
  }

  async function loadContent() {
    const res = await fetch('content.json?' + Date.now());
    content = await res.json();
  }

  function showEditor() {
    loginScreen.hidden = true;
    editor.hidden = false;
    buildForm();
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pw = document.getElementById('login-password').value;
    if (pw === adminPassword) {
      sessionStorage.setItem(AUTH_KEY, pw);
      loginError.hidden = true;
      showEditor();
    } else {
      loginError.hidden = false;
    }
  });

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
    setStatus('Downloaded content.json', 'ok');
  });

  document.getElementById('btn-save').addEventListener('click', async () => {
    const data = collectFormData();
    setStatus('Saving…', '');
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Save failed');
      content = data;
      setStatus('Saved. Refresh the main site to see changes.', 'ok');
    } catch {
      setStatus('Could not save. Run start.bat, then try again. Or use Download JSON.', 'err');
    }
  });

  async function init() {
    await loadConfig();
    if (sessionStorage.getItem(AUTH_KEY) === adminPassword) {
      await loadContent();
      showEditor();
    }
  }

  init();
})();
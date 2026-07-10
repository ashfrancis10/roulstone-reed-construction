(function (global) {
  async function loadContent() {
    try {
      const res = await fetch('content.json?' + Date.now());
      if (!res.ok) throw new Error('Failed to load content');
      return await res.json();
    } catch {
      return null;
    }
  }

  function setText(sel, value) {
    if (value == null) return;
    document.querySelectorAll(sel).forEach((el) => {
      el.textContent = value;
    });
  }

  function setBtnText(sel, value) {
    if (value == null) return;
    document.querySelectorAll(sel).forEach((el) => {
      const wrap = el.querySelector('.btn-text');
      if (wrap) {
        wrap.querySelectorAll('span').forEach((s) => { s.textContent = value; });
      } else {
        el.textContent = value;
      }
    });
  }

  function setImg(sel, src, alt) {
    document.querySelectorAll(sel).forEach((el) => {
      if (src) el.src = src;
      if (alt != null) el.alt = alt;
    });
  }

  function applyContent(data) {
    if (!data) return;

    if (data.meta) {
      if (data.meta.title) document.title = data.meta.title;
      const desc = document.querySelector('meta[name="description"]');
      if (desc && data.meta.description) desc.content = data.meta.description;
    }

    if (data.hero) {
      setText('.home-hero-top .display', data.hero.title);
      setText('.home-hero-bottom .kicker', data.hero.kicker);
      setText('.home-hero-bottom .lead', data.hero.tagline);
      setImg('.home-hero-bg img', data.hero.image);
    }

    if (data.heroImage) {
      setImg('.hero-image img', data.heroImage.src, data.heroImage.alt);
    }

    if (data.about) {
      setText('.text-cta .display-sm', data.about.title);
      setText('.text-cta .lead', data.about.text);
      setBtnText('.text-cta .btn', data.about.button);
    }

    if (data.services) {
      setText('.collection-head .kicker', data.services.kicker);
      setText('.collection-copy p', data.services.text);
      setBtnText('.collection-copy .btn', data.services.button);
      const cards = document.querySelectorAll('.collection-card');
      (data.services.items || []).forEach((item, i) => {
        if (!cards[i]) return;
        const h3 = cards[i].querySelector('h3');
        const img = cards[i].querySelector('img');
        if (h3 && item.title) h3.textContent = item.title;
        if (img && item.image) img.src = item.image;
      });
    }

    if (data.showroom) {
      setText('.showroom-content .kicker', data.showroom.kicker);
      setText('.showroom-title', data.showroom.title);
      setText('.showroom-label', data.showroom.addressLabel);
      setText('.showroom-address', data.showroom.address);
      setImg('.showroom-media img', data.showroom.image);
    }

    if (data.projects) {
      setText('.projects-top .kicker', data.projects.kicker);
      setText('.projects-right .display-sm', data.projects.intro);
      setBtnText('.projects-right .btn', data.projects.button);
      const rows = document.querySelectorAll('.project-item');
      (data.projects.items || []).forEach((item, i) => {
        if (!rows[i]) return;
        const name = rows[i].querySelector('.project-item-name');
        const tags = rows[i].querySelector('.project-item-tags');
        if (name && item.name) name.textContent = item.name;
        if (tags && item.tags) tags.textContent = item.tags;
        if (item.image) rows[i].dataset.img = item.image;
      });
    }

    if (data.duo) {
      const duoA = document.querySelector('.duo-a img');
      const duoB = document.querySelector('.duo-b img');
      if (duoA && data.duo.imageA) duoA.src = data.duo.imageA;
      if (duoB && data.duo.imageB) duoB.src = data.duo.imageB;
    }

    if (data.stories) {
      setText('.stories-head .kicker', data.stories.kicker);
      const storyEls = document.querySelectorAll('.story');
      (data.stories.items || []).forEach((item, i) => {
        if (!storyEls[i]) return;
        const quote = storyEls[i].querySelector('.story-quote');
        const img = storyEls[i].querySelector('.story-author img');
        const name = storyEls[i].querySelector('.story-author strong');
        const role = storyEls[i].querySelector('.story-author span');
        if (quote && item.quote) quote.textContent = item.quote;
        if (img && item.image) {
          img.src = item.image;
          img.alt = item.name || '';
        }
        if (name && item.name) name.textContent = item.name;
        if (role && item.role) role.textContent = item.role;
      });
    }

    if (data.contact) {
      setText('.banner-cta .display-sm', data.contact.title);
      setText('.banner-cta .lead', data.contact.text);
      setBtnText('.banner-cta-btns .btn-black', data.contact.buttonPrimary);
      setBtnText('.banner-cta-btns .btn-alpha', data.contact.buttonSecondary);
      if (data.contact.email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
          a.href = 'mailto:' + data.contact.email;
          if (a.textContent.includes('@')) a.textContent = data.contact.email;
        });
      }
    }

    if (data.footer) {
      const copy = document.querySelector('.site-footer-meta > span');
      if (copy && data.footer.copyright) copy.textContent = data.footer.copyright;
      const ig = document.querySelector('.site-footer-links a[target="_blank"]');
      if (ig) {
        if (data.footer.instagramUrl) ig.href = data.footer.instagramUrl;
        if (data.footer.instagramLabel) ig.textContent = data.footer.instagramLabel;
      }
    }
  }

  global.SiteContent = { loadContent, applyContent };
})(window);
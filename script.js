(async function () {
  if (window.SiteContent) {
    const data = await SiteContent.loadContent();
    if (data) SiteContent.applyContent(data);
  }

  const intro = document.getElementById('intro');
  const header = document.getElementById('header');
  const menu = document.getElementById('menu');
  const burger = document.getElementById('burger');
  const headerBtn = document.getElementById('header-btn');
  const scrollEl = document.getElementById('scroll');
  const reveals = document.querySelectorAll('.reveal');
  const projectItems = document.querySelectorAll('.project-item');
  const projectFloat = document.getElementById('project-float');
  const projectFloatImg = document.getElementById('project-float-img');
  const stories = document.querySelectorAll('.story');
  const storiesCount = document.getElementById('stories-count');
  const storyPrev = document.getElementById('story-prev');
  const storyNext = document.getElementById('story-next');
  const showroomMedia = document.querySelector('.showroom-media img');
  const headerMarquee = document.querySelector('.header-marquee');

  let menuOpen = false;
  let storyIndex = 0;
  let lenis;

  /* ── Lenis smooth scroll ── */
  if (typeof Lenis !== 'undefined' && scrollEl) {
    lenis = new Lenis({
      wrapper: scrollEl,
      content: scrollEl.querySelector('main'),
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  function scrollTo(target) {
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { offset: 0 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ── Intro sequence ── */
  function runIntro() {
    if (!intro) return;

    setTimeout(() => intro.classList.add('cube-in'), 100);
    setTimeout(() => intro.classList.add('cube-spin'), 400);
    setTimeout(() => intro.classList.add('wordmark-in'), 800);
    setTimeout(() => intro.classList.add('overlay-on'), 1600);
    setTimeout(() => {
      intro.classList.add('done');
      header.classList.add('visible');
      document.body.classList.add('intro-done');
    }, 2200);
  }

  runIntro();

  /* ── Menu ── */
  function toggleMenu() {
    menuOpen = !menuOpen;
    document.body.classList.toggle('menu-open', menuOpen);
    menu.classList.toggle('open', menuOpen);
    menu.setAttribute('aria-hidden', String(!menuOpen));
  }

  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  headerBtn.addEventListener('click', toggleMenu);

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (menuOpen) toggleMenu();
    });
  });

  /* ── Header marquee on hover ── */
  if (headerMarquee && window.matchMedia('(hover: hover)').matches) {
    const headerEl = document.getElementById('header');
    let marqueeX = 0;
    let rafId;

    headerEl.addEventListener('mouseenter', () => {
      if (menuOpen) return;
      function tick() {
        marqueeX -= 0.5;
        if (marqueeX <= -headerMarquee.offsetWidth / 2) marqueeX = 0;
        headerMarquee.style.transform = `translateX(${marqueeX}px)`;
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    });

    headerEl.addEventListener('mouseleave', () => {
      cancelAnimationFrame(rafId);
      headerMarquee.style.transform = '';
      marqueeX = 0;
    });
  }

  /* ── Scroll reveals ── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.08, root: scrollEl || null, rootMargin: '0px 0px -5% 0px' }
  );

  reveals.forEach((el) => revealObserver.observe(el));

  /* ── Showroom parallax ── */
  if (showroomMedia && scrollEl) {
    const showroom = document.querySelector('.showroom');
    function updateShowroom() {
      if (!showroom) return;
      const rect = showroom.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (viewH - rect.top) / (rect.height + viewH)));
      const scale = 1 + progress * 0.15;
      showroomMedia.style.transform = `scale(${scale})`;
    }

    if (lenis) {
      lenis.on('scroll', updateShowroom);
    } else {
      scrollEl.addEventListener('scroll', updateShowroom, { passive: true });
    }
    updateShowroom();
  }

  /* ── Project hover preview ── */
  if (projectFloat && window.matchMedia('(min-width: 1024px)').matches) {
    projectItems.forEach((item) => {
      item.addEventListener('mouseenter', () => {
        const src = item.dataset.img;
        if (!src) return;
        projectFloatImg.src = src;
        projectFloat.classList.add('visible');
      });

      item.addEventListener('mousemove', (e) => {
        projectFloat.style.left = e.clientX + 28 + 'px';
        projectFloat.style.top = e.clientY - 140 + 'px';
      });

      item.addEventListener('mouseleave', () => {
        projectFloat.classList.remove('visible');
      });
    });
  }

  /* ── Stories slider ── */
  function showStory(i) {
    storyIndex = (i + stories.length) % stories.length;
    stories.forEach((s, idx) => s.classList.toggle('active', idx === storyIndex));
    if (storiesCount) {
      const n = String(storyIndex + 1).padStart(2, '0');
      const total = String(stories.length).padStart(2, '0');
      storiesCount.textContent = `${n} / ${total}`;
    }
  }

  if (storyPrev) storyPrev.addEventListener('click', () => showStory(storyIndex - 1));
  if (storyNext) storyNext.addEventListener('click', () => showStory(storyIndex + 1));
  showStory(0);

  /* ── Anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) toggleMenu();
      scrollTo(target);
    });
  });
})();
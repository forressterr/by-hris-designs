/**
 * Single source of truth for portfolio content.
 * Pages pull from here so copy can be edited in one place.
 */

// ---------- Identity ----------
export const profile = {
  name: 'Hristian Goretsov',
  brand: 'By_Hris Designs',
  title: 'Multi-Disciplinary Experience Designer',
  location: 'Eindhoven, NL',
  email: 'h.goretsov@gmail.com',
  linkedin: 'https://www.linkedin.com/in/hristian-goretsov-aba5a0231/',
  status: 'Open for roles in the Netherlands, Bulgaria, and remote.',
};

// ---------- Projects ----------
// `slug`  → URL path under /projects/:slug
// `name`  → label shown on the project card grid
// `date`  → small meta date next to the name (kept in the original _MM.YY shape)
// `title` → full title on the project detail page
// `headline` → secondary heading used inside the project page
// `description` → opening paragraph on the project detail page
export const projects = [
  // ─────────────────────────────────────────────────────────────────
  // SURGE — first project with a populated `caseStudy` field.
  // When `caseStudy` is present, Project.jsx renders real content into
  // the template (otherwise placeholders fill every section). Other
  // projects can be migrated one at a time by adding their own
  // `caseStudy` block.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'surge',
    cover: '/projects/surge/cover.jpg',
    tags: ['storefront', 'ecommerce', 'retail', 'tech'],
    name: 'SURGE®',
    date: '_24',
    title: 'Surge — Built to Compete',
    headline:
      'A tech storefront redesigned to hold a multi-vertical range — built to convert from the first scroll to the confirmation screen.',
    description:
      'Surge is a tech storefront operating in one of the fastest-moving retail verticals on the market. The redesign reset the visual language and the browsing-to-checkout flow so the catalogue could finally hold its full range, from office peripherals to bespoke PC build components and high-end competitive gaming gear.',
    year: '2024',
    client: 'Surge',
    timeline: '4 – 8 weeks',
    status: 'Closed',
    caseStudy: {
      eyebrow: 'STOREFRONT · 2024',
      overview: {
        hero: {
          src: '/projects/surge/home-desktop.jpg',
          alt: 'Surge — home page hero',
          label: 'Home — desktop',
        },
        lead:
          'Built to compete. The existing site couldn’t hold the catalogue depth or the ambition; the redesign is a ground-up rethink, minimalist and modern, with the product always at the centre.',
      },
      problem:
        'A tech storefront in one of the fastest-moving retail verticals — office peripherals, bespoke PC build components, high-end competitive gaming gear, and a content subscription layer on top — running on a site that couldn’t hold that range, or that ambition. The brief needed more than a refresh.',
      process:
        'The brief was clear: minimalist and modern, with the product always at the centre. A new visual language built around sharp layouts, purposeful gradients, and a browsing-to-checkout flow that actually moved. Responsive across devices, precise in hierarchy, and designed to convert.',
      screens: [
        { src: '/projects/surge/home-desktop.jpg',     label: 'Home — landing' },
        { src: '/projects/surge/category-desktop.jpg', label: 'Category — browse' },
        { src: '/projects/surge/product-desktop.jpg', label: 'Product detail' },
        { src: '/projects/surge/vendor-desktop.jpg',  label: 'Vendor profile' },
      ],
      mobile: [
        { src: '/projects/surge/home-mobile.jpg',     label: 'Home' },
        { src: '/projects/surge/category-mobile.jpg', label: 'Browse' },
        { src: '/projects/surge/product-mobile.jpg',  label: 'Product' },
      ],
      scrollViewport: {
        src: '/projects/surge/home-desktop-full.jpg',
        alt: 'Full Surge home page — scroll-pinned in a desktop frame',
      },
      hotspots: {
        src: '/projects/surge/home-desktop.jpg',
        alt: 'Surge home with annotated highlights',
        callouts: [
          {
            x: 18, y: 22,
            label: 'Editorial-led hero',
            body: 'Single product at the centre, one clear next action. No banner clutter.',
          },
          {
            x: 70, y: 38,
            label: 'Featured SKU panel',
            body: 'Live price, adaptive ANC badge, and the SKU number locked to the right rail.',
          },
          {
            x: 40, y: 80,
            label: 'Three-line value props',
            body: 'Tuned-not-loud, same-day ship, honest pricing — surfaced above the fold, never re-explained.',
          },
        ],
      },
      switcher: [
        { id: 'home',     label: 'Home',     src: '/projects/surge/home-desktop.jpg',     alt: 'Surge — Home' },
        { id: 'category', label: 'Browse',   src: '/projects/surge/category-desktop.jpg', alt: 'Surge — Category' },
        { id: 'product',  label: 'Product',  src: '/projects/surge/product-desktop.jpg',  alt: 'Surge — Product' },
        { id: 'vendor',   label: 'Vendor',   src: '/projects/surge/vendor-desktop.jpg',   alt: 'Surge — Vendor' },
      ],
      outcome: {
        copy:
          'Shipped as a closed engagement — a minimalist visual system, a responsive layout from phone to ultrawide, and a browsing-to-checkout flow tuned to convert across the full catalogue.',
        stats: [
          { value: '4',     label: 'Top-level catalogue surfaces' },
          { value: '8 wk',  label: 'Concept to closed engagement' },
          { value: 'Mob–UW', label: 'Responsive range' },
        ],
      },
    },
  },
  // ─────────────────────────────────────────────────────────────────
  // CIPHER — streetwear storefront (Next.js 16 marketplace). Second
  // fully-populated `caseStudy`. Visuals are real-app captures via
  // Playwright (next start → 1440×900 desktop, 390×844@2x mobile),
  // not Figma exports. `scrollViewport` is intentionally omitted while
  // the pinned-scroll slot is being reworked, so it shows a Placeholder.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'cipher',
    cover: '/projects/cipher/cover.jpg',
    tags: ['storefront', 'ecommerce', 'retail', 'fashion', 'marketplace'],
    name: 'CIPHER®',
    date: '_24',
    title: 'Cipher — Where the Block Meets the Browser',
    headline:
      'A streetwear storefront that reads like a printed lookbook — editorial and retail side by side, built to convert on culture, not despite it.',
    description:
      'Cipher is a streetwear storefront where the buyer comes for the culture as much as the cut. The redesign trades a catalogue-with-a-checkout for a magazine, a gallery, and a corner-shop counter rolled into one — bold, image-led, and unafraid to take up space, switching register from editorial to retail without losing the thread.',
    year: '2024 — 2025',
    client: 'Cipher',
    timeline: '4 – 8 weeks',
    status: 'Finished',
    caseStudy: {
      eyebrow: 'STOREFRONT · 2024–25',
      overview: {
        hero: {
          src: '/projects/cipher/home-desktop.jpg',
          alt: 'Cipher — home page hero',
          label: 'Home — desktop',
        },
        lead:
          'Where the block meets the browser. Streetwear is bought for the culture as much as the cut, so the redesign trades a catalogue-with-a-checkout for something closer to a printed lookbook — bold, image-led, and unafraid to take up space.',
      },
      problem:
        'Streetwear isn’t sold the way other categories are. The buyer comes for the culture as much as the cut — they want to feel the world the brand lives in before they ever add to bag. The existing storefront wasn’t doing that: a catalogue with a checkout, in a moment that demanded a magazine, a gallery, and a corner-shop counter rolled into one.',
      process:
        'The redesign reset the entire posture. The brief leaned into the visual language of US hip-hop awards and the everyday graffiti, skate, and zine culture moving through London and across Western Europe — bold, brash, generous with imagery, and unapologetic about taking up space. Art and fashion sit side by side, with layouts that switch register from editorial to retail without losing the thread.',
      screens: [
        { src: '/projects/cipher/home-desktop.jpg',     label: 'Home — landing' },
        { src: '/projects/cipher/category-desktop.jpg', label: 'Browse — Womens' },
        { src: '/projects/cipher/product-desktop.jpg',  label: 'Product detail' },
        { src: '/projects/cipher/vendor-desktop.jpg',   label: 'Vendor profile' },
      ],
      mobile: [
        { src: '/projects/cipher/home-mobile.jpg',     label: 'Home' },
        { src: '/projects/cipher/category-mobile.jpg', label: 'Browse' },
        { src: '/projects/cipher/product-mobile.jpg',  label: 'Product' },
      ],
      hotspots: {
        src: '/projects/cipher/home-desktop.jpg',
        alt: 'Cipher home with annotated highlights',
        callouts: [
          {
            x: 24, y: 45,
            label: 'Magazine-cover headline',
            body: '“Bigger & Baggier” set like a print cover — the drop is the first thing you read, not the nav.',
          },
          {
            x: 80, y: 37,
            label: 'Full-bleed lookbook image',
            body: 'The campaign shot runs full-height beside the type — product shown as culture, not packshot.',
          },
          {
            x: 13, y: 82,
            label: 'One clear next action',
            body: 'A single “Shop Drop 03” — no carousel, no banners competing for the click.',
          },
        ],
      },
      switcher: [
        { id: 'home',     label: 'Home',     src: '/projects/cipher/home-desktop.jpg',     alt: 'Cipher — Home' },
        { id: 'browse',   label: 'Browse',   src: '/projects/cipher/category-desktop.jpg', alt: 'Cipher — Browse (Womens)' },
        { id: 'product',  label: 'Product',  src: '/projects/cipher/product-desktop.jpg',  alt: 'Cipher — Product detail' },
        { id: 'vendors',  label: 'Vendors',  src: '/projects/cipher/vendors-desktop.jpg',  alt: 'Cipher — Vendors directory' },
        { id: 'lookbook', label: 'Lookbook', src: '/projects/cipher/lookbook-desktop.jpg', alt: 'Cipher — Lookbook' },
        { id: 'account',  label: 'Account',  src: '/projects/cipher/account-desktop.jpg',  alt: 'Cipher — Account' },
      ],
      outcome: {
        copy:
          'Shipped as a finished engagement — a storefront that reads more like a printed lookbook than an e-commerce site, switching register from editorial to retail without losing the thread, and converting because of it, not despite it.',
        stats: [
          { value: '5',      label: 'Catalogue & marketplace surfaces' },
          { value: '60+',    label: 'Independent vendors curated' },
          { value: '4–8 wk', label: 'Concept to finished engagement' },
        ],
      },
    },
  },
  // ─────────────────────────────────────────────────────────────────
  // ALTITUDE — travel-retail / duty-free storefront (Next.js 16,
  // next-themes light/dark). Real-app Playwright captures. First project
  // to use the light/dark hero control: `overview.themes` drives a
  // Light/Dark ribbon on the hero frame. No `screens`/`scrollViewport`
  // (the Key-screens switcher reads `switcher`; the tall-page slot is
  // hidden in the current template).
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'altitude',
    cover: '/projects/altitude/cover.jpg',
    tags: ['storefront', 'ecommerce', 'retail', 'travel', 'themed'],
    name: 'ALTITUDE®',
    date: '_25',
    title: 'Altitude — Duty-Free, Elevated',
    headline:
      'A travel-retail storefront brought up to meet a rebrand it had been lagging behind — minimal, clear, and carrying the same well-travelled confidence the brand now leads with everywhere else.',
    description:
      'Altitude is a travel-retail storefront for a brand whose rebrand had already reshaped its identity everywhere except the website. The redesign closes that gap — a minimal, clear, polished experience that lets the products and the sense of occasion carry the page, finally matching the composed, well-travelled confidence the brand leads with elsewhere.',
    year: '2025',
    client: 'Altitude',
    timeline: '4 – 8 weeks',
    status: 'Finished',
    caseStudy: {
      eyebrow: 'TRAVEL RETAIL · 2025',
      overview: {
        hero: {
          src: '/projects/altitude/category-desktop.jpg',
          alt: 'Altitude — browse (light theme)',
          label: 'Browse — light',
        },
        // Light/dark hero variants → renders a Light/Dark control ribbon.
        themes: [
          { id: 'light', label: 'Light', src: '/projects/altitude/category-desktop.jpg',      alt: 'Altitude — browse, light theme' },
          { id: 'dark',  label: 'Dark',  src: '/projects/altitude/category-desktop-dark.jpg', alt: 'Altitude — browse, dark theme' },
        ],
        lead:
          'A rebrand that reached everywhere but the storefront. The redesign brings the site up to meet it — minimal, clear, and polished, letting the products and the sense of occasion carry the page.',
      },
      problem:
        'A heavy rebrand had already reshaped the brand’s identity across social — sharper, quieter, more considered — but it stopped at the storefront door. The website was still speaking in an old voice: dated in look and feel, and missing the elevated personality the rest of the brand had grown into. For a business built on making the journey feel exclusive, the gap between the feed and the site was doing real damage.',
      process:
        'The remit was to bring the site back to life without losing the thread of decisions the client had already made. Working inside their guidance rather than around it, I rebuilt the experience around a minimal, clear, and polished aesthetic — letting the products and the sense of occasion carry the page. The result closes the gap: a storefront that finally matches the rebrand, and carries the same composed, well-travelled confidence the brand now leads with everywhere else.',
      mobile: [
        { src: '/projects/altitude/browse-mobile.jpg',   label: 'Browse' },
        { src: '/projects/altitude/product-mobile.jpg',  label: 'Product' },
        { src: '/projects/altitude/checkout-mobile.jpg', label: 'Checkout' },
      ],
      hotspots: {
        src: '/projects/altitude/category-desktop.jpg',
        alt: 'Altitude browse with annotated highlights',
        callouts: [
          {
            x: 20, y: 25,
            label: 'Category as editorial',
            body: 'Each category opens on a full-bleed banner and a line of copy — the storefront keeps its sense of occasion even at the shelf.',
          },
          {
            x: 10, y: 66,
            label: 'Browse, the calm way',
            body: 'A quiet filter rail — categories, price, brand — keeps the range navigable without ever crowding the products.',
          },
          {
            x: 58, y: 60,
            label: 'Products at the centre',
            body: 'Minimal cards let the photography carry the page; the tax-free saving sits as a small badge, never shouting.',
          },
        ],
      },
      switcher: [
        { id: 'browse',     label: 'Browse',          src: '/projects/altitude/category-desktop.jpg',   alt: 'Altitude — Browse (Liquor)' },
        { id: 'product',    label: 'Product',         src: '/projects/altitude/product-desktop.jpg',    alt: 'Altitude — Product detail' },
        { id: 'checkout',   label: 'Checkout',        src: '/projects/altitude/checkout-desktop.jpg',   alt: 'Altitude — Checkout' },
        { id: 'collect',    label: 'Click & Collect', src: '/projects/altitude/collect-desktop.jpg',    alt: 'Altitude — Click & Collect' },
        { id: 'allowances', label: 'Allowances',      src: '/projects/altitude/allowances-desktop.jpg', alt: 'Altitude — Duty-free allowances' },
      ],
      outcome: {
        copy:
          'Shipped as a finished engagement — a storefront that finally matches the rebrand, carrying the same composed, well-travelled confidence the brand now leads with everywhere else. The gap between the feed and the site is closed.',
        stats: [
          { value: '6',           label: 'Core storefront surfaces' },
          { value: 'Light + dark', label: 'Themed end to end' },
          { value: '4–8 wk',      label: 'Concept to finished engagement' },
        ],
      },
    },
  },
  // ─────────────────────────────────────────────────────────────────
  // FLORET — London flower studio storefront (Vite SPA, state-driven
  // screens, dark-default theme + light + 4 accents). Real-app Playwright
  // captures driven through the app's own "Studio controls" panel. Uses
  // the light/dark hero control (`overview.themes`), ordered Dark-first
  // since dark is the brand default.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'floret',
    cover: '/projects/floret/cover.jpg',
    tags: ['storefront', 'ecommerce', 'retail', 'themed'],
    name: 'FLORET®',
    date: '_23',
    title: 'Floret — Blooming Where It Counts',
    headline:
      'A beloved London flower studio whose website couldn’t keep up with its own feed — rebuilt around the brand’s warmth, with a reliable browse-to-checkout flow that finally closed the loop between discovery and delivery.',
    description:
      'Floret is a small but thriving London flower vendor with genuine warmth, a loyal following, and a feed full of colour people actually cared about. The problem was never the product — it was the gap between where customers fell in love with the brand and where they were meant to buy. The redesign closes it: a visual overhaul that matches the brand’s character, a rebuilt browse-and-customise experience, and a purchase flow that finally works end to end.',
    year: '2023',
    client: 'Floret',
    timeline: '4 – 8 weeks',
    status: 'Finished',
    caseStudy: {
      eyebrow: 'FLORAL STOREFRONT · 2023',
      overview: {
        hero: {
          src: '/projects/floret/home-desktop-dark.jpg',
          alt: 'Floret — home (dark theme)',
          label: 'Home — dark',
        },
        // Dark-first: dark is the brand default; light is the alternate.
        themes: [
          { id: 'dark',  label: 'Dark',  src: '/projects/floret/home-desktop-dark.jpg', alt: 'Floret — home, dark theme' },
          { id: 'light', label: 'Light', src: '/projects/floret/home-desktop.jpg',      alt: 'Floret — home, light theme' },
        ],
        lead:
          'A studio people already loved on social, let down by a website that couldn’t carry the same energy. The redesign brings the warmth, the colour, and a buy flow that actually holds together from first bloom to checkout.',
      },
      problem:
        'The product was never the problem. A small but thriving London flower vendor had the things most brands chase — warmth, a loyal following, a feed full of colour people cared about — but an outdated visual identity failed to carry that energy, and a fragmented flow (cart failures, inaccurate inventory states, a checkout that lost customers mid-journey) was quietly costing real revenue. The gap sat exactly where customers fell in love with the brand and where they were meant to buy.',
      process:
        'The redesign addressed all of it: a visual overhaul that matched the brand’s character, a rebuilt browsing and customization experience — size tiers, finishing touches, occasion filters — and a reliable, end-to-end purchase flow that finally closed the loop between discovery and delivery. Built themed (dark and light) with four accent palettes so the studio can dress the storefront to the season.',
      mobile: [
        { src: '/projects/floret/home-mobile.jpg',    label: 'Home' },
        { src: '/projects/floret/browse-mobile.jpg',  label: 'Browse' },
        { src: '/projects/floret/product-mobile.jpg', label: 'Product' },
      ],
      hotspots: {
        src: '/projects/floret/home-desktop-dark.jpg',
        alt: 'Floret home with annotated highlights',
        callouts: [
          {
            x: 24, y: 37,
            label: 'Feed-worthy hero',
            body: 'A full-bleed seasonal image and editorial type carry the same warmth as the social feed — the site finally looks like the brand people fell for.',
          },
          {
            x: 72, y: 42,
            label: 'Flowers do the selling',
            body: 'Photography runs full-bleed and colour-forward, exactly the way the brand’s feed has always sold the product.',
          },
          {
            x: 14, y: 63,
            label: 'A short path to buy',
            body: '“Shop the season” and “Browse the studio” — two clear ways in, turning a scroll-stopping feed into a one-click route to checkout.',
          },
        ],
      },
      switcher: [
        { id: 'home',     label: 'Home',     src: '/projects/floret/home-desktop-dark.jpg', alt: 'Floret — Home' },
        { id: 'browse',   label: 'Browse',   src: '/projects/floret/browse-desktop.jpg',    alt: 'Floret — Browse (bouquets)' },
        { id: 'product',  label: 'Product',  src: '/projects/floret/product-desktop.jpg',   alt: 'Floret — Product detail' },
        { id: 'cart',     label: 'Bag',      src: '/projects/floret/cart-desktop.jpg',      alt: 'Floret — Bag' },
        { id: 'checkout',     label: 'Checkout',  src: '/projects/floret/checkout-desktop.jpg',     alt: 'Floret — Checkout' },
        { id: 'confirmation', label: 'Confirmed', src: '/projects/floret/confirmation-desktop.jpg', alt: 'Floret — Order confirmed, bouquet on the way' },
      ],
      outcome: {
        copy:
          'Shipped as a finished engagement — a storefront that finally carries the brand’s warmth, a rebuilt browse-and-customise experience, and a reliable purchase flow from first bloom to confirmation. The loop between discovery and delivery is closed, and the revenue that was leaking out of cart failures and a lost checkout is closed with it.',
        stats: [
          { value: '6',            label: 'Screens, discovery to delivery' },
          { value: 'Light + dark', label: 'Themed, four accent palettes' },
          { value: '4–8 wk',       label: 'Concept to finished engagement' },
        ],
      },
    },
  },
  // ─────────────────────────────────────────────────────────────────
  // DAILY DOJO — calm productivity app (tasks/goals/habits). Full-stack
  // monorepo; the Vite SPA frontend renders from local sample data, so
  // real-app Playwright captures were taken in demo mode (injected demo
  // JWT to clear the auth gate). shadcn/ui + OKLCH tokens + next-themes,
  // so the hero uses the light/dark control (Light-first).
  // NOTE: meta (year/client/timeline/status) is placeholder — confirm.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'daily-dojo',
    cover: '/projects/daily-dojo/cover.jpg',
    tags: ['app', 'product', 'saas', 'themed', 'productivity'],
    name: 'DAILY DOJO',
    date: '_26',
    title: 'Daily Dojo — Discipline, Minus the Noise',
    headline:
      'Tasks, goals, and habits in one calm place — Modern Minimal with an energetic edge: neutral surfaces, generous whitespace, and a single confident lime accent for everything alive and active.',
    description:
      'Daily Dojo is a calm, focused productivity platform — tasks, goals, and habits in one place, with the discipline of a dojo and none of the noise. The design language is Modern Minimal with an energetic edge: clean neutral surfaces and generous whitespace as the base, a single confident lime/chartreuse accent for everything active, and periwinkle + cyan as a small categorical palette for cards, tags, and statuses.',
    year: '2026',
    client: 'Personal',
    timeline: '2 weeks in',
    status: 'In progress',
    caseStudy: {
      eyebrow: 'PRODUCTIVITY APP · 2025',
      overview: {
        hero: {
          src: '/projects/daily-dojo/home-desktop.jpg',
          alt: 'Daily Dojo — Today (light theme)',
          label: 'Today — light',
        },
        themes: [
          { id: 'light', label: 'Light', src: '/projects/daily-dojo/home-desktop.jpg',      alt: 'Daily Dojo — Today, light theme' },
          { id: 'dark',  label: 'Dark',  src: '/projects/daily-dojo/home-desktop-dark.jpg', alt: 'Daily Dojo — Today, dark theme' },
        ],
        lead:
          'A productivity surface tuned to feel precise and quietly motivating. Neutral surfaces and whitespace do the focusing; a single lime accent does the motivating. Minimal, but never sterile — and fully themed, light and dark.',
      },
      problem:
        'Most productivity tools solve for capture, then drown you in it — notifications, badges, every surface competing for attention. Daily Dojo set out to do the opposite: hold tasks, goals, and habits in one place with the discipline of a dojo and none of the noise, so the tool gets out of the way of the actual work.',
      process:
        'A Modern-Minimal system with an energetic edge. Clean neutral surfaces and generous whitespace as the base; a single confident lime/chartreuse accent for everything alive and active; periwinkle and cyan as a small categorical palette for cards, tags, and statuses. Built on shadcn/ui with OKLCH tokens, Radix Colors scales, and Lucide icons — full light/dark via next-themes, generous radius, low elevation, bold headings.',
      mobile: [
        { src: '/projects/daily-dojo/home-mobile.jpg',   label: 'Today' },
        { src: '/projects/daily-dojo/tasks-mobile.jpg',  label: 'Tasks' },
        { src: '/projects/daily-dojo/habits-mobile.jpg', label: 'Habits' },
      ],
      hotspots: {
        src: '/projects/daily-dojo/home-desktop.jpg',
        alt: 'Daily Dojo Today with annotated highlights',
        callouts: [
          {
            x: 13, y: 13,
            label: 'One confident accent',
            body: 'A single lime/chartreuse marks everything alive and active — the one colour allowed to compete for your eye.',
          },
          {
            x: 42, y: 18,
            label: 'The day at a glance',
            body: 'Tasks, goals, habits, and streak in one quiet strip — the whole practice summarised before you scroll.',
          },
          {
            x: 25, y: 38,
            label: 'Calm, categorical',
            body: 'Periwinkle and cyan tag categories without shouting; whitespace and low elevation keep the list legible, never busy.',
          },
        ],
      },
      switcher: [
        { id: 'login',  label: 'Log in',  src: '/projects/daily-dojo/login-desktop.jpg',  alt: 'Daily Dojo — Log in' },
        { id: 'signup', label: 'Sign up', src: '/projects/daily-dojo/signup-desktop.jpg', alt: 'Daily Dojo — Sign up' },
        { id: 'today',  label: 'Today',  src: '/projects/daily-dojo/home-desktop.jpg',   alt: 'Daily Dojo — Today' },
        { id: 'tasks',  label: 'Tasks',  src: '/projects/daily-dojo/tasks-desktop.jpg',  alt: 'Daily Dojo — Tasks' },
        { id: 'goals',  label: 'Goals',  src: '/projects/daily-dojo/goals-desktop.jpg',  alt: 'Daily Dojo — Goals' },
        { id: 'habits', label: 'Habits', src: '/projects/daily-dojo/habits-desktop.jpg', alt: 'Daily Dojo — Habits' },
      ],
      outcome: {
        copy:
          'A productivity surface that feels precise and quietly motivating — tasks, goals, and habits unified under one calm system, themed light and dark, with the lime accent doing the motivating and the neutrals doing the focusing. Minimal, but never sterile.',
        stats: [
          { value: '4',            label: 'Surfaces — today, tasks, goals, habits' },
          { value: 'Light + dark', label: 'Themed via OKLCH tokens' },
          { value: 'shadcn/ui',    label: 'Radix Colors · Lucide · next-themes' },
        ],
      },
    },
  },
  // ─────────────────────────────────────────────────────────────────
  // FUNDEDR — community network for founders & investors (Reddit +
  // LinkedIn, project-first). Visuals captured from the design system's
  // own complete app screens (standalone React/Babel HTML pages),
  // statebar dev-strip hidden. Single (light) theme → standard hero.
  // NOTE: meta (year/client/timeline/status) is placeholder — confirm.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'fundedr',
    cover: '/projects/fundedr/cover.jpg',
    tags: ['app', 'product', 'saas', 'social', 'community'],
    name: 'FUNDEDR',
    date: '_26',
    title: 'Fundedr — Every Project, a Pitch',
    headline:
      'A community-first network for founders and investors — built around sharing projects in a structured elevator-pitch format, not ads or achievement-bragging, with a Reddit/StackOverflow-style thread for finding collaborators, funders, and feedback.',
    description:
      'Fundedr is a social platform where the community is the driving force — think Reddit + LinkedIn, but for founders and investors, oriented around sharing projects rather than self-promotion. Sign-up is free with base features; advanced features sit behind a subscription. Moderation is heavy and intentional: people share projects — new opportunities or works in progress — not ads, and not achievement-bragging.',
    year: '2026',
    client: 'Fundedr',
    timeline: '2 weeks in',
    status: 'In progress',
    caseStudy: {
      eyebrow: 'SOCIAL PLATFORM · 2025',
      overview: {
        hero: {
          src: '/projects/fundedr/home-desktop.jpg',
          alt: 'Fundedr — home feed',
          label: 'Home feed — desktop',
        },
        lead:
          'The atomic unit is The Pitch — every project posted as Problem → Solution → Ask, then opened up to a threaded discussion for collaborators, funders, and feedback. A network that rewards substance over self-promotion.',
      },
      problem:
        'Founders and investors don’t have a home built for the work itself. LinkedIn rewards achievement-bragging; Reddit isn’t built for projects or capital. Fundedr is the missing middle: a heavily, intentionally moderated community where people share projects — new opportunities or works in progress — not ads, and not highlight reels, so the signal stays high and the incentives stay honest.',
      process:
        'The atomic unit is The Pitch: every project is posted in a structured elevator-pitch format — Problem → Solution → Ask. From any project, a Reddit/StackOverflow-style discussion thread with tags lets people find collaborators, funders, and feedback. Two roles drive everything (founder and investor); sign-up is free with base features, while advanced tools — deal-flow tracking, advanced Find-mode filters, profile insights — sit behind a subscription.',
      mobile: [
        { src: '/projects/fundedr/home-mobile.jpg',   label: 'Feed' },
        { src: '/projects/fundedr/detail-mobile.jpg', label: 'Project' },
        { src: '/projects/fundedr/find-mobile.jpg',   label: 'Find' },
      ],
      hotspots: {
        src: '/projects/fundedr/home-desktop.jpg',
        alt: 'Fundedr feed with annotated highlights',
        callouts: [
          {
            x: 49, y: 30,
            label: 'Every post is a pitch',
            body: 'Problem hook up top, the Ask one line down, full Problem → Solution → Ask behind “Read pitch”. Projects, never ads.',
          },
          {
            x: 26, y: 40,
            label: 'Find by what’s needed',
            body: 'Facets for what a project is looking for — funders, collaborators, feedback — plus stage and tags, filtering the feed live.',
          },
          {
            x: 86, y: 18,
            label: 'The community’s signal',
            body: 'Trending projects and suggested collaborators surface who to back and who to build with — the community doing the ranking.',
          },
        ],
      },
      switcher: [
        { id: 'feed',     label: 'Feed',          src: '/projects/fundedr/home-desktop.jpg',          alt: 'Fundedr — Home feed' },
        { id: 'project',  label: 'Project',       src: '/projects/fundedr/detail-desktop.jpg',        alt: 'Fundedr — Project detail + discussion' },
        { id: 'find',     label: 'Find',          src: '/projects/fundedr/find-desktop.jpg',          alt: 'Fundedr — Find mode' },
        { id: 'composer', label: 'Composer',      src: '/projects/fundedr/composer-desktop.jpg',      alt: 'Fundedr — Composer' },
        { id: 'profile',  label: 'Profile',       src: '/projects/fundedr/profile-desktop.jpg',       alt: 'Fundedr — Profile' },
        { id: 'alerts',   label: 'Notifications', src: '/projects/fundedr/notifications-desktop.jpg', alt: 'Fundedr — Notifications' },
        { id: 'pricing',  label: 'Pricing',       src: '/projects/fundedr/subscription-desktop.jpg',  alt: 'Fundedr — Subscription' },
      ],
      outcome: {
        copy:
          'A community-first network with a clear, moderated culture: every project is a structured pitch, every thread is built for finding collaborators and capital, and the model — free base, subscription for advanced tools — keeps the incentives pointed at substance over self-promotion.',
        stats: [
          { value: 'The Pitch', label: 'Problem → Solution → Ask' },
          { value: '7',         label: 'Core surfaces designed' },
          { value: 'Free + Pro', label: 'Base free, advanced by subscription' },
        ],
      },
    },
  },
];

// ---------- Services (used on the Home services row) ----------
// Card colors are intentionally untouched. Each `num` is also the key
// into ICONS inside ServiceCard.jsx (where the SVG is rendered) and
// the lookup key for the flip-card back face's subSkills list.
//
// Each subSkill now has:
//   - name:     plain text label (rendered bold on the card back)
//   - projects: array of project display names that demonstrate that
//               sub-skill. Each one renders as an inline-link routing
//               to /works for now. Initial mappings below are best-
//               guess — replace as the Works archive fills out.
export const services = [
  {
    num: '001',
    color: 'purple',
    title: 'Product Design',
    desc: 'Strategy, UX, and UI — designing the moments where a product meets the people using it.',
    subSkills: [
      { name: 'Service Design', projects: ['Fundedr', 'Daily Dojo'] },
      { name: 'Application Design', projects: ['Daily Dojo', 'Fundedr'] },
      { name: 'Design Systems', projects: ['Fundedr', 'Daily Dojo'] },
      { name: 'Complex UX Flow Implementation', projects: ['Fundedr', 'Altitude'] },
      { name: 'Scalable Solutions', projects: ['Daily Dojo', 'Fundedr'] },
      {
        name: 'SaaS and E-commerce Products',
        projects: ['Surge', 'Daily Dojo', 'Fundedr'],
      },
    ],
  },
  {
    num: '002',
    color: 'green',
    title: 'Web Design',
    desc: 'Marketing, editorial, e-commerce — websites built fast, built right, and built to last.',
    subSkills: [
      {
        name: 'Responsive and Modern Designs',
        projects: ['Cipher', 'Altitude'],
      },
      { name: 'Clear User Flow', projects: ['Floret', 'Altitude'] },
      { name: 'Visual Storytelling', projects: ['Cipher', 'Floret'] },
      { name: 'SEO Optimisation', projects: ['Surge'] },
      { name: 'Branding and Identity', projects: ['Cipher', 'Floret', 'Altitude'] },
      { name: 'Portfolios and More', projects: ['Fundedr'] },
    ],
  },
  {
    num: '003',
    color: 'pink',
    title: 'UX/UI Design',
    desc: 'Research-driven interfaces, accessible and detail-considered — the craft of making products feel obvious.',
    subSkills: [
      { name: 'Semantic Research', projects: ['Fundedr'] },
      {
        name: 'Competitors Analysis and Strategy',
        projects: ['Cipher', 'Altitude'],
      },
      { name: 'User Research', projects: ['Floret', 'Fundedr'] },
      { name: 'User Flows', projects: ['Altitude', 'Fundedr'] },
      { name: 'Sketches and Wireframes', projects: ['Daily Dojo', 'Fundedr'] },
      { name: 'Interactive Rapid Prototyping', projects: ['Daily Dojo', 'Fundedr'] },
      { name: 'Design System', projects: ['Fundedr', 'Daily Dojo'] },
    ],
  },
  {
    num: '004',
    color: 'yellow',
    title: 'Creative Design',
    desc: 'Brand systems, art direction, 3D, and the experimental work that doesn’t fit a brief — where the spark lives.',
    subSkills: [
      { name: 'Visual Design', projects: ['Cipher', 'Floret'] },
      { name: 'Presentations Design' },
      { name: '3D Design and Modelling' },
      { name: 'Photography', projects: ['Floret', 'Cipher'] },
      { name: 'Arts and Crafts' },
      {
        name: 'Game Design',
      },
    ],
  },
];

// ---------- Home: marquee sub-skill cards ----------
// Flat list of every sub-skill across all four service categories
// (Product / Web / UX-UI / Creative). Each entry powers one tile in
// the home-page sliding marquee, structured to match the front face
// of the service cards: index → icon → title → caption.
//
// Colour cycles through the same four pastel accents used by the
// service cards (purple → green → pink → yellow) so neighbouring
// tiles in the marquee never share a background.
//
// `icon` is a key into the ICONS map in MarqueeSubSkillCard.jsx —
// each sub-skill gets a visually distinct SVG that nods at the
// skill it describes.
export const marqueeSubSkills = [
  // 001–006 — Product Design sub-skills
  { num: '001', color: 'purple', icon: 'service-design',
    title: 'Service Design',
    caption: 'Mapping touchpoints, handoffs, and the wait-times in between.' },
  { num: '002', color: 'green', icon: 'application-design',
    title: 'Application Design',
    caption: 'Tools that earn their place in a daily workflow.' },
  { num: '003', color: 'pink', icon: 'design-systems',
    title: 'Design Systems',
    caption: 'One source of truth across every screen.' },
  { num: '004', color: 'yellow', icon: 'complex-flows',
    title: 'Complex UX Flow Implementation',
    caption: 'Many-step journeys made to feel like three.' },
  { num: '005', color: 'purple', icon: 'scalable',
    title: 'Scalable Solutions',
    caption: 'Patterns that hold as products and teams grow.' },
  { num: '006', color: 'green', icon: 'saas-ecom',
    title: 'SaaS and E-commerce Products',
    caption: 'Subscriptions and checkouts that stay out of the way.' },

  // 007–012 — Web Design sub-skills
  { num: '007', color: 'pink', icon: 'responsive',
    title: 'Responsive and Modern Designs',
    caption: 'Right on a phone, a laptop, and the screen on the wall.' },
  { num: '008', color: 'yellow', icon: 'clear-flow',
    title: 'Clear User Flow',
    caption: 'The shortest path from "landed here" to "did the thing."' },
  { num: '009', color: 'purple', icon: 'storytelling',
    title: 'Visual Storytelling',
    caption: 'Pages that read like a narrative, not a list.' },
  { num: '010', color: 'green', icon: 'seo',
    title: 'SEO Optimisation',
    caption: 'Found by humans first, search engines second.' },
  { num: '011', color: 'pink', icon: 'brand',
    title: 'Branding and Identity',
    caption: 'A logo, a voice, a feel — consistent everywhere.' },
  { num: '012', color: 'yellow', icon: 'portfolio',
    title: 'Portfolios and More',
    caption: 'The work in front, controls quietly out of the way.' },

  // 013–019 — UX/UI Design sub-skills
  { num: '013', color: 'purple', icon: 'semantic-research',
    title: 'Semantic Research',
    caption: 'Reading what users mean, not just what they say.' },
  { num: '014', color: 'green', icon: 'competitors',
    title: 'Competitors Analysis and Strategy',
    caption: 'Knowing the field before placing the bet.' },
  { num: '015', color: 'pink', icon: 'user-research',
    title: 'User Research',
    caption: 'Interviews and observation — the "huh, that’s odd" moments.' },
  { num: '016', color: 'yellow', icon: 'user-flows',
    title: 'User Flows',
    caption: 'Diagramming the path before a single pixel goes down.' },
  { num: '017', color: 'purple', icon: 'wireframes',
    title: 'Sketches and Wireframes',
    caption: 'Cheap, fast, throwaway — the right tool early on.' },
  { num: '018', color: 'green', icon: 'prototyping',
    title: 'Interactive Rapid Prototyping',
    caption: 'Clickable mockups, testable before they’re built.' },
  { num: '019', color: 'pink', icon: 'design-system-ux',
    title: 'Design System',
    caption: 'Tokens, components, docs — coherence by default.' },

  // 020–025 — Creative Design sub-skills
  { num: '020', color: 'yellow', icon: 'visual',
    title: 'Visual Design',
    caption: 'Posters, prints, type — the craft side of the practice.' },
  { num: '021', color: 'purple', icon: 'slides',
    title: 'Presentations Design',
    caption: 'Decks that earn their slot in a calendar.' },
  { num: '022', color: 'green', icon: '3d',
    title: '3D Design and Modelling',
    caption: 'Real-time scenes, renders, and props built in Blender.' },
  { num: '023', color: 'pink', icon: 'photo',
    title: 'Photography',
    caption: 'Light and framing as a design tool.' },
  { num: '024', color: 'yellow', icon: 'craft',
    title: 'Arts and Crafts',
    caption: 'Hands-on, off-screen experiments that feed the digital work.' },
  { num: '025', color: 'purple', icon: 'game',
    title: 'Game Design',
    caption: 'Mechanics, levels, and the small loops that make a game tick.' },
];

// ---------- About: bio paragraphs ----------
export const bio = [
  'I’ve been making things since I could hold scissors. Weekends as a kid were spent running our corner "tattoo shop" with the neighbourhood kids — armed with sharpies and ballpoint pens — recording stop-motion Lego films, and helping my dad solder things back to life in the garage. Looking back, that’s where the design instinct started: not in a classroom, but in the small loop of imagine → make → show someone → fix it and repeat.',
  'Today I work as a multi-disciplinary experience designer. I move comfortably between UX research, UI craft, product strategy and design, design systems, and the occasional front-end build — because the most interesting problems rarely sit only inside one of those buckets. Over the last few years I’ve designed storefronts and commerce experiences (Surge, Cipher, Altitude, Floret) and product platforms (Daily Dojo, Fundedr), moving across SaaS and e-commerce for international clients.',
  'Alongside the day job, I’m finishing an MSc in Human-Computer Interaction at Utrecht University. My thesis — Bridging the User Flows and Data Flows — looks at how design can make the hidden system layers behind a product (the data, the rules, the orchestration) legible to the people using it. The natural intersection of what I do at work and what I keep getting curious about.',
];

// ---------- About: codex ("Codes to live by") ----------
// Authored as FAQ-shaped { question, answer } so the About page can render
// them through the same accordion component used elsewhere on the site.
export const codex = [
  {
    question: 'Respect people’s time.',
    answer:
      'Whether it’s a meeting that could’ve been an email or a checkout that should’ve been three taps less, time is the one thing nobody gets back. Cut anything that doesn’t earn its place — in a product flow or a Saturday afternoon.',
  },
  {
    question: 'Make, don’t just talk about making.',
    answer:
      'Sketches beat slides, prototypes beat specs, a bad first draft beats a perfect outline that never ships. Same goes for the half-built bookshelf in the corner — it’s still further along than the one you’ve been planning for a year.',
  },
  {
    question: 'Stay close to the people doing the work.',
    answer:
      'The dev shipping the code, the chef plating the dish, the friend who actually assembled the IKEA shelf — whoever is closest to the work usually has the best answer. Ask them first, opine later.',
  },
  {
    question: 'Stay curious, on purpose.',
    answer:
      'Treat every "huh, that’s odd" as an invitation. The same instinct that makes me poke at a weird API response is the one that makes me ask the bartender what’s in the drink. Both pay off more often than they should.',
  },
  {
    question: 'Show your work.',
    answer:
      'Hide the process and the only thing people can judge is the final thing. Show the drafts, the rabbit holes, the why-this-not-that — and the work starts to mean something. Goes for design files, group chats, and dinner-table arguments.',
  },
];

// ---------- About: skills, tools, achievements ----------
export const skills = [
  { name: 'Product Design', desc: 'Strategy, UX, UI — end-to-end across web and SaaS' },
  { name: 'UX / UI Design', desc: 'Research-driven interfaces, accessible and detail-considered' },
  { name: 'Service Design', desc: 'Mapping experiences across touchpoints and teams' },
  { name: 'Web Design', desc: 'Marketing, editorial, e-commerce — built fast, built right' },
  { name: 'Design Systems', desc: 'Foundations, components, governance — built to actually be used' },
  { name: 'User Research', desc: 'Generative and evaluative — before and after launch' },
  { name: 'Rapid Prototyping', desc: 'Paper, Figma, Framer, React — choose the right fidelity' },
  { name: '3D Modelling', desc: 'Blender, for product, brand, and the experimental side' },
];

export const tools = [
  { name: 'Figma + FigJam + Slides', desc: 'Daily driver for design, whiteboarding, and stakeholder showcases' },
  { name: 'Blender', desc: '3D modelling for product, brand, and the more experimental work' },
  { name: 'Framer', desc: 'Web design and rapid interactive prototypes' },
  { name: 'Adobe Creative Suite', desc: 'Illustration, image work, layout when needed' },
  { name: 'Cursor + Claude Code', desc: 'Where the design files become production code' },
  { name: 'Codex', desc: 'Quick scaffolding and code exploration' },
];

export const achievements = [
  {
    name: 'Innovations Fair',
    desc: 'Utrecht University · 2025 — a smart-bedside wind-down companion, shown as a calmer alternative to phone-based bedtime rituals',
  },
  {
    name: 'Music × ICT Competition',
    desc: 'Utrecht University · 2025 — Concept and prototype for a story-driven music-theory game for ages 9+',
  },
  {
    name: 'Jumbo Hackathon',
    desc: 'Veghel, NL · 2025 — Selected for the final round with "Crowd’s Best Choice", a Jumbo HQ product-discovery concept',
  },
  {
    name: '2 Design Systems',
    desc: 'Built from the ground up — the Fundedr system and Daily Dojo’s OKLCH-tokened component set',
  },
];

// ---------- Testimonials (Home section under Services) ----------
// Same shape philosophy as `services` — `num` keys into ICONS inside
// TestimonialCard.jsx; `color` reuses the same 4-color accent palette
// so the cards visually pair with the services row above.
//
// Each entry maps to one of the four "praise" themes:
//   001 → Decision making + organisation
//   002 → Good team dynamics
//   003 → Strive for growth + exploration
//   004 → Spark for creativity
//
// All names/companies/quotes are placeholder content; the data shape
// is the contract, so dropping in real testimonials later is just a
// per-field swap (no markup changes needed).
export const testimonials = [
  {
    num: '001',
    color: 'purple',
    title: 'Decisive & Organised',
    name: 'Alex Morgan',
    initials: 'AM',
    role: 'Product Manager',
    company: 'Northwind Labs',
    location: 'Amsterdam, NL',
    quote:
      'Hristian has a rare talent for cutting through complexity and turning vague briefs into structured plans. He always knows the next right step, and the team is faster for it.',
  },
  {
    num: '002',
    color: 'green',
    title: 'Brings the Team Together',
    name: 'Sam Rivers',
    initials: 'SR',
    role: 'Engineering Lead',
    company: 'Studio Atlas',
    location: 'Berlin, DE',
    quote:
      'Working with Hristian on cross-functional projects is the smoothest collaboration I’ve had. He listens, translates between disciplines, and makes everyone around him better.',
  },
  {
    num: '003',
    color: 'pink',
    title: 'Always Growing',
    name: 'Maya Chen',
    initials: 'MC',
    role: 'Design Director',
    company: 'Field & Form',
    location: 'London, UK',
    quote:
      'Few designers I’ve worked with show this much hunger to grow. Hristian is curious, fearless about new tools, and turns every project into an opportunity to learn something new.',
  },
  {
    num: '004',
    color: 'yellow',
    title: 'Creative Spark',
    name: 'Jordan Patel',
    initials: 'JP',
    role: 'Creative Director',
    company: 'Mosaic Studio',
    location: 'New York, US',
    quote:
      'There’s a creative spark in everything Hristian touches. He brings ideas to the table that nobody else would think of, and somehow makes them work in production too.',
  },
];

// ---------- Labs (purpose rows beneath the canvas) ----------
export const labsAbout = [
  {
    name: 'Work in progress',
    desc: 'The half-built, the rough draft, the thing I’d usually keep off the portfolio until it was polished. Here it gets to exist anyway.',
  },
  {
    name: 'Side quests',
    desc: 'Personal explorations that don’t fit the day job — 3D, brand experiments, weekend builds, anything that lets the curiosity off the leash.',
  },
  {
    name: 'Principles I’m testing',
    desc: 'New ways of thinking about a design problem — frameworks, instincts, and manners picked up recently and not yet fully formed.',
  },
  {
    name: 'AI × design',
    desc: 'The ever-expanding horizon of what AI gives designers — what it changes, what it accelerates, and what it asks us to rethink.',
  },
  {
    name: 'Skills in flight',
    desc: 'Tools, techniques, and disciplines I’m actively adding to the arsenal. Some land, some don’t — both end up in here.',
  },
];

// Labs teaser stats (Home) — a brief read on what the Labs page is for.
export const labsStats = [
  { value: '5',     label: 'Strands of exploration, from work-in-progress to skills in flight' },
  { value: 'Raw',   label: 'Half-built and unpolished, on purpose' },
  { value: 'Live',  label: 'A working map of what I’m exploring now, not a finished archive' },
  { value: 'Spark', label: 'New tools and patterns, pressure-tested on real problems' },
];

// ---------- FAQ (Home & Contact) ----------
// Rewritten to sit closer to the person than the practice — questions
// people actually ask after they've poked around the site for a few
// minutes, answered in the same casual tone as the "Codes to live by"
// section. Covers practice (work, tools, range), background (how I
// got here, the thesis, location), and the curiosity loop (stuck
// projects, side tinkering, what gets me to reach for a sketchpad).
export const homeFaqs = [
  {
    question: 'What’s the work you’re proudest of?',
    answer:
      'Usually whatever half-finished thing is on the desk that week. Career-wise, the rewarding stretches have been the ones where research, UI, and engineering shared a room — the storefront redesigns (Surge, Cipher, Altitude, Floret) and the product platforms (Daily Dojo, Fundedr), with a handful of brand identities along the way.',
  },
  {
    question: 'What kind of work are you taking right now?',
    answer:
      'Product, experience, and web design roles in the Netherlands, Bulgaria, or fully remote. For freelance: brand identities, web design, design systems, and front-end builds. Most engagements ship in 4–8 weeks; brand sprints faster, full product redesigns longer.',
  },
  {
    question: 'Design or code — where do you actually live?',
    answer:
      'Both, most days. Enough HTML/CSS/JS, React, and Framer to keep the design ↔ engineering loop short, without pretending to be a full-time engineer. The shorter the handoff, the better the shipped thing tends to be.',
  },
  {
    question: 'How did you fall into design?',
    answer:
      'Long before I had a word for it — running a corner ‘tattoo shop’ with sharpies as a kid, stop-motion Lego films on weekends, soldering broken things in my dad’s garage. Design was just the discipline I happened to land in; the imagine → make → show → fix loop was already there.',
  },
  {
    question: 'What’s the MSc in HCI actually about?',
    answer:
      'I’m finishing a thesis at Utrecht called Bridging the User Flows and Data Flows — how design can make the hidden system layers behind a product (data, rules, orchestration) legible to the people using it. It’s where the day job and the curiosity I keep getting back to actually meet.',
  },
  {
    question: 'What tools earn their spot in your kit?',
    answer:
      'Figma (with FigJam and Slides) for design, Blender for 3D, Framer when the web side needs hands, the Adobe suite when needed, and Cursor + Claude Code on the code side. The kit changes faster than the principles — loose about which tool, strict about what the work needs to do.',
  },
  {
    question: 'Do you work with international clients?',
    answer:
      'Yes — past work spans the UK, Ireland, the US, and Australia. Eindhoven-based and comfortable across CET-friendly zones; async-first, with weekly syncs and short Loom recordings instead of meetings where I can.',
  },
  {
    question: 'What’s a “huh, that’s odd” moment that turned into a project?',
    answer:
      'Most of the work I keep going back to started this way — a weird API response, an interface that asked too many questions, a pattern everyone copies but nobody questions. The thesis came out of one of them. I treat those moments like invitations.',
  },
  {
    question: 'What do you do when a project gets stuck?',
    answer:
      'Get away from the screen and talk to whoever’s closest to the actual work — the dev shipping the code, the support person fielding the angry emails, the user themselves when I can. They almost always have the answer before I do. Then I sketch, build the roughest possible thing, and put it in someone’s hands.',
  },
  {
    question: 'What can’t you stop tinkering with outside of work?',
    answer:
      'Blender scenes, photography (landscapes mostly, the odd portrait), and game design — that last one started as a hobby and is still burning with wildfire in the heart. I also keep quietly rebuilding bits of this site in the background.',
  },
  {
    question: 'Why Eindhoven?',
    answer:
      'Studied here, stayed for the design community and the everyday weirdness of Dutch Design Week. Sofia is home and where the family is; Eindhoven is where I work, study, and bike to most things.',
  },
  {
    question: 'What’s the easiest way to start a conversation?',
    answer:
      'Drop a note via the contact form or my email directly. I usually reply within 1–2 working days. Always up for a coffee.',
  },
];

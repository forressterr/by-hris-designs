/**
 * Single source of truth for portfolio content.
 * Pages pull from here so copy can be edited in one place.
 */

import type { Profile } from '../types/content';

// ---------- Identity ----------
export const profile: Profile = {
  name: 'Hristian Goretsov',
  brand: 'By_Hris Designs',
  title: 'Multi-Disciplinary Experience Designer',
  location: 'Eindhoven, NL',
  email: 'h.goretsov@gmail.com',
  linkedin: 'https://www.linkedin.com/in/hristian-goretsov-aba5a0231/',
  status: 'Open for roles in the Netherlands, Bulgaria, and remote.',
};

// ---------- Services (used on the Home services row) ----------
// Card colors are intentionally untouched. Each `num` is also the key
// into ICONS inside ServiceCard.tsx (where the SVG is rendered) and
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
      {
        name: 'Complex UX Flow Implementation',
        projects: ['Fundedr', 'Altitude'],
      },
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
      {
        name: 'Branding and Identity',
        projects: ['Cipher', 'Floret', 'Altitude'],
      },
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
      {
        name: 'Interactive Rapid Prototyping',
        projects: ['Daily Dojo', 'Fundedr'],
      },
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
// `icon` is a key into the ICONS map in MarqueeSubSkillCard.tsx —
// each sub-skill gets a visually distinct SVG that nods at the
// skill it describes.
export const marqueeSubSkills = [
  // 001–006 — Product Design sub-skills
  {
    num: '001',
    color: 'purple',
    icon: 'service-design',
    title: 'Service Design',
    caption: 'Mapping touchpoints, handoffs, and the wait-times in between.',
  },
  {
    num: '002',
    color: 'green',
    icon: 'application-design',
    title: 'Application Design',
    caption: 'Tools that earn their place in a daily workflow.',
  },
  {
    num: '003',
    color: 'pink',
    icon: 'design-systems',
    title: 'Design Systems',
    caption: 'One source of truth across every screen.',
  },
  {
    num: '004',
    color: 'yellow',
    icon: 'complex-flows',
    title: 'Complex UX Flow Implementation',
    caption: 'Many-step journeys made to feel like three.',
  },
  {
    num: '005',
    color: 'purple',
    icon: 'scalable',
    title: 'Scalable Solutions',
    caption: 'Patterns that hold as products and teams grow.',
  },
  {
    num: '006',
    color: 'green',
    icon: 'saas-ecom',
    title: 'SaaS and E-commerce Products',
    caption: 'Subscriptions and checkouts that stay out of the way.',
  },

  // 007–012 — Web Design sub-skills
  {
    num: '007',
    color: 'pink',
    icon: 'responsive',
    title: 'Responsive and Modern Designs',
    caption: 'Right on a phone, a laptop, and the screen on the wall.',
  },
  {
    num: '008',
    color: 'yellow',
    icon: 'clear-flow',
    title: 'Clear User Flow',
    caption: 'The shortest path from "landed here" to "did the thing."',
  },
  {
    num: '009',
    color: 'purple',
    icon: 'storytelling',
    title: 'Visual Storytelling',
    caption: 'Pages that read like a narrative, not a list.',
  },
  {
    num: '010',
    color: 'green',
    icon: 'seo',
    title: 'SEO Optimisation',
    caption: 'Found by humans first, search engines second.',
  },
  {
    num: '011',
    color: 'pink',
    icon: 'brand',
    title: 'Branding and Identity',
    caption: 'A logo, a voice, a feel — consistent everywhere.',
  },
  {
    num: '012',
    color: 'yellow',
    icon: 'portfolio',
    title: 'Portfolios and More',
    caption: 'The work in front, controls quietly out of the way.',
  },

  // 013–019 — UX/UI Design sub-skills
  {
    num: '013',
    color: 'purple',
    icon: 'semantic-research',
    title: 'Semantic Research',
    caption: 'Reading what users mean, not just what they say.',
  },
  {
    num: '014',
    color: 'green',
    icon: 'competitors',
    title: 'Competitors Analysis and Strategy',
    caption: 'Knowing the field before placing the bet.',
  },
  {
    num: '015',
    color: 'pink',
    icon: 'user-research',
    title: 'User Research',
    caption: 'Interviews and observation — the "huh, that’s odd" moments.',
  },
  {
    num: '016',
    color: 'yellow',
    icon: 'user-flows',
    title: 'User Flows',
    caption: 'Diagramming the path before a single pixel goes down.',
  },
  {
    num: '017',
    color: 'purple',
    icon: 'wireframes',
    title: 'Sketches and Wireframes',
    caption: 'Cheap, fast, throwaway — the right tool early on.',
  },
  {
    num: '018',
    color: 'green',
    icon: 'prototyping',
    title: 'Interactive Rapid Prototyping',
    caption: 'Clickable mockups, testable before they’re built.',
  },
  {
    num: '019',
    color: 'pink',
    icon: 'design-system-ux',
    title: 'Design System',
    caption: 'Tokens, components, docs — coherence by default.',
  },

  // 020–025 — Creative Design sub-skills
  {
    num: '020',
    color: 'yellow',
    icon: 'visual',
    title: 'Visual Design',
    caption: 'Posters, prints, type — the craft side of the practice.',
  },
  {
    num: '021',
    color: 'purple',
    icon: 'slides',
    title: 'Presentations Design',
    caption: 'Decks that earn their slot in a calendar.',
  },
  {
    num: '022',
    color: 'green',
    icon: '3d',
    title: '3D Design and Modelling',
    caption: 'Real-time scenes, renders, and props built in Blender.',
  },
  {
    num: '023',
    color: 'pink',
    icon: 'photo',
    title: 'Photography',
    caption: 'Light and framing as a design tool.',
  },
  {
    num: '024',
    color: 'yellow',
    icon: 'craft',
    title: 'Arts and Crafts',
    caption: 'Hands-on, off-screen experiments that feed the digital work.',
  },
  {
    num: '025',
    color: 'purple',
    icon: 'game',
    title: 'Game Design',
    caption: 'Mechanics, levels, and the small loops that make a game tick.',
  },
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
  {
    name: 'Product Design',
    desc: 'Strategy, UX, UI — end-to-end across web and SaaS',
  },
  {
    name: 'UX / UI Design',
    desc: 'Research-driven interfaces, accessible and detail-considered',
  },
  {
    name: 'Service Design',
    desc: 'Mapping experiences across touchpoints and teams',
  },
  {
    name: 'Web Design',
    desc: 'Marketing, editorial, e-commerce — built fast, built right',
  },
  {
    name: 'Design Systems',
    desc: 'Foundations, components, governance — built to actually be used',
  },
  {
    name: 'User Research',
    desc: 'Generative and evaluative — before and after launch',
  },
  {
    name: 'Rapid Prototyping',
    desc: 'Paper, Figma, Framer, React — choose the right fidelity',
  },
  {
    name: '3D Modelling',
    desc: 'Blender, for product, brand, and the experimental side',
  },
];

export const tools = [
  {
    name: 'Figma + FigJam + Slides',
    desc: 'Daily driver for design, whiteboarding, and stakeholder showcases',
  },
  {
    name: 'Blender',
    desc: '3D modelling for product, brand, and the more experimental work',
  },
  { name: 'Framer', desc: 'Web design and rapid interactive prototypes' },
  {
    name: 'Adobe Creative Suite',
    desc: 'Illustration, image work, layout when needed',
  },
  {
    name: 'Cursor + Claude Code',
    desc: 'Where the design files become production code',
  },
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
// TestimonialCard.tsx; `color` reuses the same 4-color accent palette
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

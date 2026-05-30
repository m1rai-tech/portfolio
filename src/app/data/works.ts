export type Work = {
  id: string;
  title: string;
  year: string;
  category: "Web" | "Apps" | "Tools";
  blurb: string;
  description: string;
  coverImage: string;
  images: string[];
  stack: string[];
  link: string;
};

export const works: Work[] = [
  {
    id: "p2p-marketplace",
    title: "P2P Маркетплейс",
    year: "2026",
    category: "Web",
    blurb: "будували вдвох з нуля. є чат, оплата, модерація — все як в людей.",
    description:
      "Повноцінний p2p-маркетплейс, який зробили з колегою. Supabase — авторизація, realtime-чат з вкладеннями, база. Stripe — оплата буст-розміщень. Є пошук зі смарт-ранжуванням, категорії, скарги, бани, адмін-панель, відгуки. Писали JSX, не TypeScript — бо так швидше. Перший серйозний проект де я відповідав за архітектуру.",
    coverImage: "/market.jpg",
    images: ["/market.jpg"],
    stack: ["React", "Vite", "Supabase", "Stripe", "React Router"],
    link: "https://market-demo-omega.vercel.app/",
  },
  {
    id: "desktop-browser",
    title: "Web 2.0 Browser",
    year: "2026",
    category: "Apps",
    blurb: "власний браузер. бо чого б і ні.",
    description:
      "Почалось як експеримент «а чи можу я зібрати браузер за вихідні». Не зміг. Збирав довше. Electron 33 + React + Vite, кастомний UI на MUI і Radix, темна тема з коробки, мінімум зайвого. Білдиться в .exe через electron-builder. Працює, відкриває ютуб, я задоволений.",
    coverImage: "/web.jpg",
    images: ["/web.jpg"],
    stack: ["Electron", "React", "Vite", "MUI", "Tailwind"],
    link: "https://github.com/m1rai-tech/web-2.0",
  },
  {
    id: "nova-bot",
    title: "Nova — AI Chat",
    year: "2026",
    category: "Web",
    blurb: "свій AI-чат з streaming, markdown і бічною панеллю.",
    description:
      "Односторінковий AI-чат на чистому React без збірника. Gemini API зі streaming — відповідь з'являється в реальному часі. Markdown-рендеринг: жирний, курсив, заголовки, списки, блоки коду з кнопкою копіювання. Бічна панель з історією чатів, темна/світла тема, скасування запиту.",
    coverImage: "/Project_4.jpg",
    images: ["/Project_4.jpg"],
    stack: ["React", "Tailwind", "Gemini API"],
    link: "https://m1rai-tech.github.io/nova-bot/",
  },
  {
    id: "santexnik-landing",
    title: "Сантехнік Микола",
    year: "2025",
    category: "Web",
    blurb: "демо-лендінг для майстра. карта, контакти, жодного зайвого.",
    description:
      "Демо-проект: практика верстки лендінгу для приватного майстра. Чистий HTML/CSS/JS, без фреймворків. Leaflet з кастомним маркером, хвильові дивайдери, анімовані іконки у hero.",
    coverImage: "/Project_1.jpg",
    images: ["/Project_1.jpg"],
    stack: ["HTML", "CSS", "JavaScript", "Leaflet"],
    link: "https://m1rai-tech.github.io/demo1/",
  },
  {
    id: "zatishok-cafe",
    title: "Затишок — Кав'ярня",
    year: "2025",
    category: "Web",
    blurb: "демо. меню з табами, галерея, карта. тепло і без зайвого.",
    description:
      "Демо-проект: практика верстки для кав'ярні. Playfair Display для заголовків, три вкладки меню з фото-картками, фотогалерея, Leaflet-карта з кастомним маркером. Все на ванільному JS.",
    coverImage: "/Project_2.jpg",
    images: ["/Project_2.jpg"],
    stack: ["HTML", "CSS", "JavaScript", "Leaflet"],
    link: "https://m1rai-tech.github.io/demo2/",
  },
  {
    id: "klassyk-barbershop",
    title: "Класик — Барбершоп",
    year: "2025",
    category: "Web",
    blurb: "демо. темна тема, золото, барбершоп-атмосфера. без React.",
    description:
      "Демо-проект: практика верстки для барбершопу. Темна тема (#0d0d0d), золоті акценти, Oswald для заголовків. Прайс-список з hover-ефектом, картки майстрів, галерея з grayscale-переходом. Чистий HTML/CSS/JS.",
    coverImage: "/Project_3.jpg",
    images: ["/Project_3.jpg"],
    stack: ["HTML", "CSS", "JavaScript"],
    link: "https://m1rai-tech.github.io/demo3/",
  },
];

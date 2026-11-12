export const content = {
  ua: {
    htmlLang: "uk",
    meta: {
      title: "akirasata — Frontend-розробник",
      description:
        "Данило Сторожук. Сайти та застосунки на React і TypeScript, десктоп на Electron. Роботи та контакти.",
    },
    language: { label: "Мова сайту", ua: "Українська", en: "English" },
    navigation: {
      label: "Основна навігація",
      home: "На початок",
      about: "Про мене",
      stack: "Навички",
      works: "Роботи",
      contact: "Контакти",
      openMenu: "Відкрити меню",
      closeMenu: "Закрити меню",
      skipToContent: "Перейти до вмісту",
    },
    hero: {
      name: "akira sata.",
      role: "Frontend-розробник",
      description:
        "Розробляю сайти та застосунки на React і TypeScript. Верстаю за макетами, підключаю API, готую до запуску.",
      technologies: ["React", "TypeScript", "Next.js", "Electron"],
      status: "Відкритий до проєктів",
      services: "Сайти · Вебзастосунки · Десктоп",
      writeAction: "Написати",
      worksAction: "Дивитися роботи",
      contactAction: "Обговорити проєкт",
      stackLabel: "Основний стек",
    },
    about: {
      title: "Про мене.",
      name: "Данило Сторожук",
      role: "Frontend-розробник",
      photoAlt: "Данило Сторожук",
      introduction:
        "Працюю з React і TypeScript, створюю десктопні застосунки на Electron. Можу зверстати готовий макет або зібрати інтерфейс із нуля.",
      description:
        "Підключаю авторизацію, бази даних та оплату. Використовую AI-асистентів у розробці; перевірку коду й роботу застосунку беру на себе.",
      status: "Відкритий до проєктів",
      services: [
        {
          id: "interfaces",
          title: "Інтерфейси",
          description:
            "Адаптивна верстка за макетами з Figma, компоненти та анімації.",
        },
        {
          id: "integrations",
          title: "Інтеграції",
          description:
            "Авторизація, дані й чат через Supabase, оплата через Stripe.",
        },
        {
          id: "launch",
          title: "Запуск",
          description:
            "Публікація сайтів на Vercel, збірка десктопних застосунків на Electron.",
        },
      ],
    },
    stack: {
      title: "Навички і стек.",
      countLabel: "Технології: {count}",
      categories: [
        {
          id: "interfaces",
          title: "Інтерфейси",

          summary: "Верстаю адаптивні сторінки за макетом, роблю компоненти й анімації, які легко підтримувати.",

          items: [
            {
              id: "react",
              name: "React",
              description: "Компоненти та інтерфейси",
            },
            { id: "nextjs", name: "Next.js", description: "Вебзастосунки" },
            { id: "typescript", name: "TypeScript", description: "Типізація" },
            {
              id: "tailwind",
              name: "Tailwind CSS",
              description: "Стилі та адаптивна верстка",
            },
            {
              id: "vite",
              name: "Vite",
              description: "Середовище розробки та збірка",
            },
          ],
        },
        {
          id: "server",
          title: "Сервер та інтеграції",

          summary: "Підключаю авторизацію, базу даних, оплату та AI-функції.",

          items: [
            {
              id: "nodejs",
              name: "Node.js",
              description: "Серверна логіка та API",
            },
            {
              id: "supabase",
              name: "Supabase",
              description: "База даних, авторизація, realtime",
            },
            { id: "stripe", name: "Stripe", description: "Приймання оплат" },
            {
              id: "vercel-ai-sdk",
              name: "Vercel AI SDK",
              description: "AI-інтеграції та потокові відповіді",
            },
          ],
        },
        {
          id: "desktop",
          title: "Десктоп",

          summary: "Збираю десктопні застосунки для Windows на вебтехнологіях.",

          items: [
            {
              id: "electron",
              name: "Electron",
              description: "Десктопні застосунки",
            },
          ],
        },
        {
          id: "tools",
          title: "Інструменти",

          summary: "Від макета у Figma до публікації на Vercel.",

          items: [
            { id: "figma", name: "Figma", description: "Макети інтерфейсів" },
            { id: "git", name: "Git / GitHub", description: "Контроль версій" },
            { id: "vercel", name: "Vercel", description: "Публікація сайтів" },
          ],
        },
      ],
    },
    works: {
      title: "Роботи.",
      filtersLabel: "Фільтрувати роботи",
      filters: {
        all: "Усі",
        web: "Веб",
        apps: "Застосунки",
        tools: "Інструменти",
      },
      projectTypes: {
        collaborative: "Спільний проєкт",
        personal: "Особистий проєкт",
        demo: "Демо",
      },
      viewProject: "Докладніше про «{title}»",
      empty: "У цій категорії поки немає проєктів.",
      demosLabel: "Демо-сайти",
      cursor: "Відкрити",
      projects: {
        "p2p-marketplace": {
          title: "P2P-маркетплейс",
          description:
            "Маркетплейс із чатом, оплатою просування оголошень і модерацією. Розробляли вдвох; я відповідав за архітектуру.",
          previewAlt: "Інтерфейс P2P-маркетплейсу",
        },
        "desktop-browser": {
          title: "Web 2.0 Browser",
          description:
            "Браузер на Electron із власним інтерфейсом на React. Реалізував темну тему та налаштував збірку для Windows.",
          previewAlt: "Інтерфейс Web 2.0 Browser у темній темі",
        },
        "santexnik-landing": {
          title: "Сантехнік Микола",
          description:
            "Демо сайту приватного майстра. Зверстав сторінку з контактами, інтерактивною картою та анімацією іконок.",
          previewAlt: "Сторінка сайту «Сантехнік Микола»",
        },
        "zatishok-cafe": {
          title: "Затишок — кав’ярня",
          description:
            "Демо сайту кав’ярні. Реалізував меню з вкладками, фотогалерею та карту на Leaflet.",
          previewAlt: "Сторінка сайту кав’ярні «Затишок»",
        },
        "klassyk-barbershop": {
          title: "Класик — барбершоп",
          description:
            "Демо сайту барбершопу. Зверстав прайс, картки майстрів і галерею з ефектами наведення.",
          previewAlt: "Сторінка сайту барбершопу «Класик»",
        },
        "rivnovaha-yoga": {
          title: "Рівновага — йога-студія",
          description:
            "Демо редизайну сайту йога-студії. Реалізував розклад із вибором дня, перемикання інструкторів і блок відгуків.",
          previewAlt: "Сторінка сайту йога-студії «Рівновага»",
        },
      },
      githubCard: {
        title: "Інші роботи на GitHub",
        description: "Невеликі застосунки, UI-компоненти та експерименти.",
        action: "Переглянути репозиторії",
      },
      modal: {
        close: "Закрити проєкт",
        technologies: "Технології",
        openWebsite: "Відкрити сайт",
        viewCode: "Переглянути код",
        enlargeImage: "Збільшити зображення",
        closeImage: "Закрити зображення",
        previousImage: "Попереднє зображення",
        nextImage: "Наступне зображення",
        imagePosition: "Зображення {current} із {total}",
        imageUnavailable: "Зображення недоступне",
      },
    },
    contact: {
      title: "Контакти.",
      heading: "Обговорімо ваш проєкт.",
      description:
        "Напишіть, що потрібно зробити. Якщо є макет, приклади або бажаний термін — додайте їх до повідомлення.",
      action: "Написати в Telegram",
      otherContacts: "Інші способи зв’язку",
      processLabel: "Як працюємо",
      steps: [
        {
          id: "brief",
          title: "Задача",
          description:
            "Обговорюємо, для кого робимо проєкт і що має працювати.",
        },
        {
          id: "scope",
          title: "Домовленості",
          description: "Узгоджуємо обсяг роботи, терміни та вартість.",
        },
        {
          id: "development",
          title: "Розробка",
          description:
            "Показую проміжні версії, погоджуємо правки, готую проєкт до запуску.",
        },
      ],
      channels: {
        telegram: "Обговорити проєкт",
        instagram: "Особистий профіль",
        github: "Код проєктів",
      },
      copyUsername: "Скопіювати ім’я користувача",
      copied: "Скопійовано",
      copyFailed: "Не вдалося скопіювати. Скопіюйте вручну.",
    },
    footer: {
      copyright: "© {year} akirasata",
      credit: "Дизайн і розробка — akirasata",
      socialLinksLabel: "Соціальні мережі та GitHub",
      backToTop: "На початок",
    },
    brands: {
      telegram: "Telegram",
      instagram: "Instagram",
      github: "GitHub",
    },
  },
  en: {
    htmlLang: "en",
    meta: {
      title: "akirasata — Frontend developer",
      description:
        "Danylo Storozhuk. Websites and apps built with React and TypeScript, desktop apps with Electron. Selected work and contact details.",
    },
    language: { label: "Site language", ua: "Українська", en: "English" },
    navigation: {
      label: "Main navigation",
      home: "Back to top",
      about: "About",
      stack: "Skills",
      works: "Work",
      contact: "Contact",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      skipToContent: "Skip to content",
    },
    hero: {
      name: "akira sata.",
      role: "Frontend developer",
      description:
        "I build websites and apps with React and TypeScript, turning designs into working interfaces, connecting APIs, and getting projects ready to launch.",
      technologies: ["React", "TypeScript", "Next.js", "Electron"],
      status: "Available for projects",
      services: "Websites · Web apps · Desktop apps",
      writeAction: "Message me",
      worksAction: "See my work",
      contactAction: "Discuss a project",
      stackLabel: "Core stack",
    },
    about: {
      title: "About.",
      name: "Danylo Storozhuk",
      role: "Frontend developer",
      photoAlt: "Danylo Storozhuk",
      introduction:
        "I work with React and TypeScript and build desktop apps with Electron. I can work from your designs or put together an interface from scratch.",
      description:
        "I integrate authentication, databases, and payments. AI assistants are part of my workflow; I take responsibility for reviewing the code and checking that the app works.",
      status: "Available for projects",
      services: [
        {
          id: "interfaces",
          title: "Interfaces",
          description:
            "Responsive layouts from Figma designs, reusable components, and animation.",
        },
        {
          id: "integrations",
          title: "Integrations",
          description:
            "Authentication, data, and chat with Supabase. Payments with Stripe.",
        },
        {
          id: "launch",
          title: "Launch",
          description:
            "Website deployment on Vercel and desktop app builds with Electron.",
        },
      ],
    },
    stack: {
      title: "Skills & stack.",
      countLabel: "Technologies: {count}",
      categories: [
        {
          id: "interfaces",
          title: "Interfaces",

          summary: "Responsive pages from designs, plus components and animation that are easy to maintain.",

          items: [
            {
              id: "react",
              name: "React",
              description: "Components and interfaces",
            },
            { id: "nextjs", name: "Next.js", description: "Web applications" },
            {
              id: "typescript",
              name: "TypeScript",
              description: "Static typing",
            },
            {
              id: "tailwind",
              name: "Tailwind CSS",
              description: "Styling and responsive layouts",
            },
            {
              id: "vite",
              name: "Vite",
              description: "Development and build tooling",
            },
          ],
        },
        {
          id: "server",
          title: "Backend & integrations",

          summary: "Auth, databases, payments and AI features.",

          items: [
            {
              id: "nodejs",
              name: "Node.js",
              description: "Server logic and APIs",
            },
            {
              id: "supabase",
              name: "Supabase",
              description: "Database, auth, and realtime",
            },
            { id: "stripe", name: "Stripe", description: "Payment processing" },
            {
              id: "vercel-ai-sdk",
              name: "Vercel AI SDK",
              description: "AI integrations and streaming responses",
            },
          ],
        },
        {
          id: "desktop",
          title: "Desktop",

          summary: "Windows desktop apps built with web tech.",

          items: [
            {
              id: "electron",
              name: "Electron",
              description: "Desktop applications",
            },
          ],
        },
        {
          id: "tools",
          title: "Tools",

          summary: "From a Figma design to a live site on Vercel.",

          items: [
            { id: "figma", name: "Figma", description: "Interface design" },
            { id: "git", name: "Git / GitHub", description: "Version control" },
            { id: "vercel", name: "Vercel", description: "Website deployment" },
          ],
        },
      ],
    },
    works: {
      title: "Work.",
      filtersLabel: "Filter projects",
      filters: { all: "All", web: "Web", apps: "Apps", tools: "Tools" },
      projectTypes: {
        collaborative: "Team project",
        personal: "Personal project",
        demo: "Demo",
      },
      viewProject: "View {title} details",
      empty: "No projects in this category yet.",
      demosLabel: "Demo websites",
      cursor: "Open",
      projects: {
        "p2p-marketplace": {
          title: "P2P Marketplace",
          description:
            "A marketplace with chat, paid listing promotion, and moderation. Built with a fellow developer; I was responsible for the architecture.",
          previewAlt: "P2P Marketplace interface",
        },
        "desktop-browser": {
          title: "Web 2.0 Browser",
          description:
            "An Electron browser with a custom React interface. I implemented the dark theme and set up Windows builds.",
          previewAlt: "Web 2.0 Browser interface in dark mode",
        },
        "santexnik-landing": {
          title: "Mykola — Plumbing Services",
          description:
            "A demo website for an independent plumber. I built the page with contact details, an interactive map, and animated icons.",
          previewAlt: "Mykola plumbing services website",
        },
        "zatishok-cafe": {
          title: "Zatyshok — Coffee Shop",
          description:
            "A demo coffee shop website. I built a tabbed menu, photo gallery, and Leaflet map.",
          previewAlt: "Zatyshok coffee shop website",
        },
        "klassyk-barbershop": {
          title: "Klasyk — Barbershop",
          description:
            "A demo barbershop website. I built the price list, barber profiles, and a gallery with hover effects.",
          previewAlt: "Klasyk barbershop website",
        },
        "rivnovaha-yoga": {
          title: "Rivnovaha — Yoga Studio",
          description:
            "A demo redesign for a yoga studio. I built a schedule with day selection, tabbed instructor profiles, and a testimonials section.",
          previewAlt: "Rivnovaha yoga studio website",
        },
      },
      githubCard: {
        title: "More work on GitHub",
        description: "Small apps, UI components, and experiments.",
        action: "Browse repositories",
      },
      modal: {
        close: "Close project",
        technologies: "Built with",
        openWebsite: "Visit website",
        viewCode: "View code",
        enlargeImage: "Enlarge image",
        closeImage: "Close image",
        previousImage: "Previous image",
        nextImage: "Next image",
        imagePosition: "Image {current} of {total}",
        imageUnavailable: "Image unavailable",
      },
    },
    contact: {
      title: "Contact.",
      heading: "Let’s talk about your project.",
      description:
        "Tell me what you need built. Include any designs, references, or deadlines you already have.",
      action: "Message me on Telegram",
      otherContacts: "Other ways to reach me",
      processLabel: "Working together",
      steps: [
        {
          id: "brief",
          title: "The brief",
          description:
            "We discuss who the project is for and what it needs to do.",
        },
        {
          id: "scope",
          title: "Scope & estimate",
          description: "We agree on the scope, timeline, and cost.",
        },
        {
          id: "development",
          title: "Development",
          description:
            "I share progress, work through revisions with you, and prepare the project for launch.",
        },
      ],
      channels: {
        telegram: "Project enquiries",
        instagram: "Personal profile",
        github: "Project code",
      },
      copyUsername: "Copy username",
      copied: "Copied",
      copyFailed: "Couldn’t copy. Please copy the username manually.",
    },
    footer: {
      copyright: "© {year} akirasata",
      credit: "Designed and built by akirasata",
      socialLinksLabel: "Social profiles and GitHub",
      backToTop: "Back to top",
    },
    brands: {
      telegram: "Telegram",
      instagram: "Instagram",
      github: "GitHub",
    },
  },
} as const;

export type Language = keyof typeof content;
export type Content = (typeof content)[Language];
export type ProjectId = keyof typeof content.ua.works.projects;
export type WorkFilter = keyof typeof content.ua.works.filters;
export type ProjectType = keyof typeof content.ua.works.projectTypes;

export function formatText(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : match,
  );
}

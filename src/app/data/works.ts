import type { ProjectId, ProjectType, WorkFilter } from "./content";

export type Work = {
  id: ProjectId;
  year: string;
  category: Exclude<WorkFilter, "all">;
  type: ProjectType;
  coverImage: string;
  images: string[];
  stack: string[];
  websiteUrl?: string;
  codeUrl?: string;
};

const base = import.meta.env.BASE_URL;

export const works: Work[] = [
  {
    id: "p2p-marketplace",
    year: "2026",
    category: "web",
    type: "collaborative",
    coverImage: `${base}market.jpg`,
    images: [`${base}market.jpg`],
    stack: ["React", "Vite", "Supabase", "Stripe", "React Router"],
    websiteUrl: "https://market-demo-omega.vercel.app/",
  },
  {
    id: "desktop-browser",
    year: "2026",
    category: "apps",
    type: "personal",
    coverImage: `${base}web.jpg`,
    images: [`${base}web.jpg`],
    stack: ["Electron", "React", "Vite", "MUI", "Tailwind CSS"],
    codeUrl: "https://github.com/m1rai-tech/web-2.0",
  },
  {
    id: "santexnik-landing",
    year: "2025",
    category: "web",
    type: "demo",
    coverImage: `${base}Project_1.jpg`,
    images: [`${base}Project_1.jpg`],
    stack: ["HTML", "CSS", "JavaScript", "Leaflet"],
    websiteUrl: "https://m1rai-tech.github.io/demo1/",
  },
  {
    id: "zatishok-cafe",
    year: "2025",
    category: "web",
    type: "demo",
    coverImage: `${base}Project_2.jpg`,
    images: [`${base}Project_2.jpg`],
    stack: ["HTML", "CSS", "JavaScript", "Leaflet"],
    websiteUrl: "https://m1rai-tech.github.io/demo2/",
  },
  {
    id: "klassyk-barbershop",
    year: "2025",
    category: "web",
    type: "demo",
    coverImage: `${base}Project_3.jpg`,
    images: [`${base}Project_3.jpg`],
    stack: ["HTML", "CSS", "JavaScript"],
    websiteUrl: "https://m1rai-tech.github.io/demo3/",
  },
  {
    id: "rivnovaha-yoga",
    year: "2025",
    category: "web",
    type: "demo",
    coverImage: `${base}Project_5.jpg`,
    images: [`${base}Project_5.jpg`],
    stack: ["HTML", "CSS", "JavaScript", "Leaflet"],
    websiteUrl: "https://m1rai-tech.github.io/demo4/",
  },
];

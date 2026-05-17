import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Next.js SaaS Starter",
  description: "Documentation for the Next.js SaaS starter template",
  lastUpdated: true,
  cleanUrls: true,

  // The setup/deployment pages intentionally link to http://localhost:*
  // dev-server URLs as instructional examples - not real dead links.
  ignoreDeadLinks: "localhostLinks",

  // Serve docs/README.md at "/" so the same file doubles as the GitHub
  // folder index and the VitePress home page - no duplicated content.
  rewrites: {
    "README.md": "index.md",
  },

  themeConfig: {
    nav: [
      { text: "Getting Started", link: "/getting-started" },
      { text: "Architecture", link: "/architecture" },
      { text: "Deployment", link: "/deployment" },
    ],

    sidebar: [
      {
        text: "Setup",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "Environment Variables", link: "/environment-variables" },
        ],
      },
      {
        text: "How it works",
        items: [
          { text: "Architecture", link: "/architecture" },
          { text: "Features", link: "/features" },
          { text: "Database", link: "/database" },
          { text: "Auth & Billing", link: "/auth-and-billing" },
          { text: "Background Jobs", link: "/background-jobs" },
          { text: "Integrations", link: "/integrations" },
          { text: "Frontend", link: "/frontend" },
        ],
      },
      {
        text: "Demos",
        items: [
          { text: "AI Chat", link: "/demos/ai" },
          { text: "Booking Wizard", link: "/demos/booking" },
          { text: "Customers Table", link: "/demos/customers" },
          { text: "Background Jobs", link: "/demos/inngest" },
          { text: "Posts CRUD", link: "/demos/posts" },
        ],
      },
      {
        text: "Shipping",
        items: [{ text: "Deployment", link: "/deployment" }],
      },
    ],

    search: {
      provider: "local",
    },
  },
});

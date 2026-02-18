import type { Config } from "@react-router/dev/config";

const slugs = [
  "getting-started",
  "authentication",
  "inference-api",
  "model-list",
  "lora-adapters",
  "batch-api",
  "adding-removing-models",
  "model-states",
  "sleep-wake",
  "fairness-policy",
  "storage-pinning",
  "metrics-usage",
  "real-time-events",
  "model-configuration",
  "requirements",
  "prerequisites",
  "install",
  "troubleshooting",
];

export default {
  ssr: false,
  basename: "/",
  async prerender() {
    return slugs.map((s) => `/${s}`);
  },
} satisfies Config;

export interface DocPage {
  slug: string;
  title: string;
  description: string;
}

export interface DocSection {
  title: string;
  pages: DocPage[];
}

export const sections: DocSection[] = [
  {
    title: "Getting Started",
    pages: [
      {
        slug: "getting-started",
        title: "Overview",
        description: "What GreenThread is and how it works",
      },
      {
        slug: "authentication",
        title: "Authentication",
        description: "API keys and Bearer token auth",
      },
    ],
  },
  {
    title: "Inference",
    pages: [
      {
        slug: "inference-api",
        title: "Inference API",
        description: "OpenAI-compatible chat and completion endpoints",
      },
      {
        slug: "model-list",
        title: "Model List & Routing",
        description: "List models, model-specific endpoints, and per-backend routing",
      },
      {
        slug: "lora-adapters",
        title: "LoRA Adapters",
        description: "On-demand LoRA adapter loading and caching",
      },
      {
        slug: "batch-api",
        title: "Batch API",
        description: "Asynchronous batch inference processing",
      },
    ],
  },
  {
    title: "Models",
    pages: [
      {
        slug: "adding-removing-models",
        title: "Adding & Removing Models",
        description: "Model CRUD operations and configuration",
      },
      {
        slug: "model-states",
        title: "Model States & Lifecycle",
        description: "State machine, transitions, and health checks",
      },
      {
        slug: "sleep-wake",
        title: "Sleep & Wake",
        description: "How sleep/wake works and performance characteristics",
      },
    ],
  },
  {
    title: "Platform",
    pages: [
      {
        slug: "fairness-policy",
        title: "Fairness Policy",
        description: "Preemption algorithm and GPU scheduling",
      },
      {
        slug: "storage-pinning",
        title: "Storage & Pinning",
        description: "Disk and RAM tiers, staging, and pinning",
      },
      {
        slug: "metrics-usage",
        title: "Metrics & Usage",
        description: "Prometheus metrics, usage tracking, and billing",
      },
    ],
  },
  {
    title: "Integration",
    pages: [
      {
        slug: "real-time-events",
        title: "Real-time Events (SSE)",
        description: "Server-Sent Events for live state updates",
      },
      {
        slug: "model-configuration",
        title: "Model Configuration",
        description: "Inference engine config, GPU memory, quantization, and tuning",
      },
    ],
  },
  {
    title: "Tools",
    pages: [
      {
        slug: "cost-calculator",
        title: "Cost Calculator",
        description: "Compare GreenThread vs Bedrock monthly costs",
      },
    ],
  },
  {
    title: "Deployment",
    pages: [
      {
        slug: "requirements",
        title: "Requirements",
        description: "Hardware, software, and licence requirements",
      },
      {
        slug: "prerequisites",
        title: "Prerequisites",
        description: "NVIDIA drivers, GPU Direct Storage, and Python setup",
      },
      {
        slug: "install",
        title: "Install",
        description: "Install GreenThread with the one-line installer",
      },
      {
        slug: "troubleshooting",
        title: "Troubleshooting",
        description: "Common issues, diagnostics, and upgrades",
      },
    ],
  },
];

export const allPages = sections.flatMap((s) => s.pages);

export function getPageBySlug(slug: string): DocPage | undefined {
  return allPages.find((p) => p.slug === slug);
}

export function getAdjacentPages(slug: string) {
  const idx = allPages.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? allPages[idx - 1] : undefined,
    next: idx < allPages.length - 1 ? allPages[idx + 1] : undefined,
  };
}

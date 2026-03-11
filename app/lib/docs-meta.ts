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
        slug: "k8s-overview",
        title: "Architecture",
        description: "Components, request flow, and sidecar endpoints",
      },
    ],
  },
  {
    title: "Deployment",
    pages: [
      {
        slug: "k8s-aws-eks",
        title: "AWS (EKS)",
        description: "Set up an EKS cluster with GPU nodes",
      },
      {
        slug: "k8s-prerequisites",
        title: "Prerequisites",
        description: "GPU Operator, DRA Driver, and Envoy Gateway",
      },
      {
        slug: "k8s-deploy",
        title: "Install GreenThread",
        description: "Helm install and verify",
      },
      {
        slug: "k8s-monitoring",
        title: "Monitoring",
        description: "Prometheus, Grafana dashboards, and alerting",
      },
    ],
  },
  {
    title: "Inference",
    pages: [
      {
        slug: "inference-api",
        title: "API Reference",
        description: "Supported inference endpoints and protocols",
      },
      {
        slug: "lora-adapters",
        title: "LoRA Adapters",
        description: "On-demand LoRA adapter loading and caching",
      },
    ],
  },
  {
    title: "Models",
    pages: [
      {
        slug: "model-configuration",
        title: "Model CRD Reference",
        description: "Model custom resource spec and configuration",
      },
      {
        slug: "model-states",
        title: "Lifecycle & States",
        description: "Phases, sleep/wake, and state transitions",
      },
      {
        slug: "deploying-models",
        title: "Deploying Models",
        description: "Deploy, update, and verify models",
      },
      {
        slug: "recipes",
        title: "Recipes",
        description: "Example deployments for popular models",
      },
    ],
  },
  {
    title: "Platform",
    pages: [
      {
        slug: "fairness-policy",
        title: "GPU Scheduling",
        description: "Fairness policy, preemption, and GPU assignment",
      },
      {
        slug: "storage-pinning",
        title: "Storage & Pinning",
        description: "NVMe storage, staging tiers, and pinning",
      },
      {
        slug: "metrics-usage",
        title: "Metrics",
        description: "Prometheus metrics and observability",
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
    title: "Deprecated (Single Node)",
    pages: [
      {
        slug: "requirements",
        title: "Requirements",
        description: "Deprecated — hardware requirements",
      },
      {
        slug: "prerequisites",
        title: "Prerequisites",
        description: "Deprecated — NVIDIA drivers, GDS, Python",
      },
      {
        slug: "install",
        title: "Install",
        description: "Deprecated — one-line installer",
      },
      {
        slug: "troubleshooting",
        title: "Troubleshooting",
        description: "Deprecated — diagnostics",
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

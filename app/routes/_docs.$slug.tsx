import { useParams } from "react-router";

const modules = import.meta.glob("../content/*.mdx", { eager: true }) as Record<
  string,
  { default: React.ComponentType }
>;

const contentMap: Record<string, React.ComponentType> = {};
for (const [path, mod] of Object.entries(modules)) {
  const slug = path.replace("../content/", "").replace(".mdx", "");
  contentMap[slug] = mod.default;
}

export default function DocPage() {
  const { slug } = useParams();
  const Content = slug ? contentMap[slug] : undefined;

  if (!Content) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-text-secondary">
          The documentation page &quot;{slug}&quot; doesn't exist.
        </p>
      </div>
    );
  }

  return <Content />;
}

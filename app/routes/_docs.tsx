import { Outlet, useLocation, Link } from "react-router";
import { Header } from "~/components/header";
import { Sidebar } from "~/components/sidebar";
import { TableOfContents } from "~/components/toc";
import { getPageBySlug, getAdjacentPages, sections } from "~/lib/docs-meta";

export default function DocsLayout() {
  const location = useLocation();
  const slug = location.pathname.replace("/", "") || "getting-started";
  const page = getPageBySlug(slug);
  const { prev, next } = getAdjacentPages(slug);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-[90rem] px-4 lg:px-8">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-14 overflow-y-auto py-8 pr-4 scrollbar-none" style={{ maxHeight: "calc(100vh - 3.5rem)" }}>
              <Sidebar />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1 overflow-hidden py-8 lg:px-8">
            {page && (
              <div className="mb-8">
                <p className="text-sm font-medium text-brand">{getSectionTitle(slug)}</p>
                <h1
                  className="mt-1 text-3xl font-bold tracking-tight"
                  style={{ fontFamily: "Instrument Sans, system-ui" }}
                >
                  {page.title}
                </h1>
                <p className="mt-2 text-text-secondary">{page.description}</p>
              </div>
            )}
            <article className="prose prose-neutral dark:prose-invert max-w-none overflow-x-auto">
              <Outlet />
            </article>

            {/* Prev/Next */}
            {(prev || next) && (
              <div className="mt-12 flex items-center justify-between border-t border-border-subtle pt-6">
                {prev ? (
                  <Link
                    to={`/${prev.slug}`}
                    className="group flex flex-col items-start"
                  >
                    <span className="text-xs font-medium text-text-muted">Previous</span>
                    <span className="text-sm font-medium text-text-secondary group-hover:text-brand">
                      {prev.title}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
                {next ? (
                  <Link
                    to={`/${next.slug}`}
                    className="group flex flex-col items-end"
                  >
                    <span className="text-xs font-medium text-text-muted">Next</span>
                    <span className="text-sm font-medium text-text-secondary group-hover:text-brand">
                      {next.title}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            )}
          </main>

          {/* TOC */}
          <aside className="hidden w-52 shrink-0 xl:block">
            <div className="sticky top-14 overflow-y-auto py-8 pl-4" style={{ maxHeight: "calc(100vh - 3.5rem)" }}>
              <TableOfContents key={slug} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function getSectionTitle(slug: string) {
  for (const s of sections) {
    if (s.pages.some((p) => p.slug === slug)) return s.title;
  }
  return "";
}

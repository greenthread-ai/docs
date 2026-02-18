import {
  type RouteConfig,
  layout,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/_docs.tsx", [
    index("routes/_docs._index.tsx"),
    route(":slug", "routes/_docs.$slug.tsx"),
  ]),
] satisfies RouteConfig;

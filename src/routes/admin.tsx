import { createFileRoute, Navigate } from "@tanstack/react-router";

// /admin is a shortcut — the real admin surface lives under _authenticated/admin
export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — DATYX" }, { name: "robots", content: "noindex" }] }),
  component: () => <Navigate to="/admin-console" replace />,
});

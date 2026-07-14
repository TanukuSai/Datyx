import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/team")({
  component: () => (
    <div>
      <h2 className="font-display text-2xl font-bold">Team</h2>
      <p className="mt-2 text-sm text-muted-foreground">Team members are currently defined in the site content. Managed CRUD is coming next — reach out to have new leads added.</p>
    </div>
  ),
});

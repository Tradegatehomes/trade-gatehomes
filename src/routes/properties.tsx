import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout for /properties and /properties/$slug — children render via <Outlet />.
export const Route = createFileRoute("/properties")({
  component: () => <Outlet />,
});

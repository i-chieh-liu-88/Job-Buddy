import { Outlet, createRootRoute } from '@tanstack/react-router'
import { NotFound } from "../components/organisms/NotFound/NotFound";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
})

function RootComponent() {
  return <Outlet />
}

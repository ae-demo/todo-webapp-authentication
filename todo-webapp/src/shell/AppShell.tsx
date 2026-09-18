// The signed-in app shell — every gated screen renders inside it via
// <Outlet/>. Structure follows the Oxygen sample's AppLayout
// (oxygen-ui-design-system/references/app-structure.md): Header in
// AppShell.Navbar, Sidebar in AppShell.Sidebar, the routed page in
// AppShell.Main, Footer in AppShell.Footer.
//
// The wireframes draw only a brand `navbar "Todo App"` on every screen, with
// no distinct sidebar items — this app has exactly one rail destination
// (TodoList; TodoForm and TodoDetail are reached by clicking through it, not
// from the rail). The rail item is still gated with <Can>, so a caller who
// cannot reach My To-Dos does not see it offered.
import type { JSX } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  ColorSchemeToggle,
  Divider,
  Footer,
  Header,
  Sidebar,
  UserMenu,
} from "@wso2/oxygen-ui";
import { ListTodo, LogOut } from "@wso2/oxygen-ui-icons-react";
import { Can, useAuthz, useHeldRoles } from "../authz/gates";
import { signOut } from "../authz/session";
import { APP_NAME } from "../appName";

export function AppShellLayout(): JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { username } = useAuthz();
  const roles = useHeldRoles();
  const active = pathname.startsWith("/todos") ? "todo-list" : "";

  async function handleSignOut(): Promise<void> {
    await signOut();
  }

  return (
    <AppShell>
      <AppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand onClick={() => navigate("/todos")}>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} />
              <UserMenu.Header
                name={username || "Signed in"}
                email=""
                role={roles.join(", ") || undefined}
              />
              <UserMenu.Item icon={<LogOut />} label="Sign out" onClick={() => void handleSignOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </AppShell.Navbar>

      <AppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            <Sidebar.Category>
              <Can op="GET /me/todos">
                <Sidebar.Item id="todo-list" link={<Link to="/todos" />}>
                  <Sidebar.ItemIcon>
                    <ListTodo />
                  </Sidebar.ItemIcon>
                  <Sidebar.ItemLabel>My To-Dos</Sidebar.ItemLabel>
                </Sidebar.Item>
              </Can>
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </AppShell.Sidebar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </AppShell.Footer>
    </AppShell>
  );
}

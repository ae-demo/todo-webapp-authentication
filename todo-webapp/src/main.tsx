import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OxygenUIThemeProvider, OxygenTheme } from "@wso2/oxygen-ui";
import { App } from "./App";

// App itself owns the <BrowserRouter> (thunder-authentication's App.example.tsx
// shape) so that ForbiddenWiring, which needs router context, sits inside it.

// Dev-only, dynamic-import-guarded. `import.meta.env.DEV` is statically false
// in a production build, so this branch and the msw chunk are both eliminated
// — the one exception to this platform's "no import.meta.env" rule, because
// DEV/MODE are build-time literals Vite substitutes, not runtime configuration.
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.MODE !== "mock") return;
  const { startMockWorker } = await import("../mock/browser");
  await startMockWorker();
}

void enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <OxygenUIThemeProvider theme={OxygenTheme}>
        <App />
      </OxygenUIThemeProvider>
    </StrictMode>,
  );
});

// The OIDC redirect target. Routed OUTSIDE the AuthzProvider (there is no
// session to read until the code exchange has happened): calls
// handleCallback() once on mount, then lands the user at the app root, which
// re-resolves the session and redirects to their landing screen.
import { useEffect, useState, type JSX } from "react";
import { Box, Stack, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";
import { APP_NAME } from "../appName";

export function CallbackPage(): JSX.Element {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        await handleCallback();
        if (live) window.location.assign("/");
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : "Sign-in failed");
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h6">{APP_NAME}</Typography>
        <Typography color="text.secondary">
          {error ? `Sign-in failed: ${error}` : "Completing sign-in…"}
        </Typography>
      </Stack>
    </Box>
  );
}

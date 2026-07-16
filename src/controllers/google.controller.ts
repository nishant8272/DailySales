import { NextFunction, Request, Response } from "express";
import authService from "../services/auth.service";
import { HttpError } from "../utils/http-error";

// GET /api/auth/google/callback?code=...&state=...
// For this codebase, we implement a lightweight callback endpoint that accepts
// a Google "id_token"-style token in query (id_token or credential) and then
// reuses the existing token-based backend logic.
//
// Note: If you want a full OAuth code->token exchange flow, we must additionally
// implement redirect URI + OAuth client flow server-side.
export const googleCallbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      (req.query.id_token as string | undefined) ||
      (req.query.idToken as string | undefined) ||
      (req.query.credential as string | undefined);

    if (!token) {
      throw new HttpError(400, "Missing Google token in callback URL");
    }

    const loginResult = await authService.continueWithGoogle(token);

    // If onboarding is needed, keep user on auth page with a status.
    // Existing frontend onboarding expects to call /google/continue and /google/onboard.
    // For now we redirect with ?needsOnboarding=1 and store token in localStorage
    // via a tiny inline script.
    const frontendOrigin =
      process.env.FRONTEND_ORIGIN?.replace(/\/$/, "") ||
      "http://localhost:5173";

    const needsOnboarding = Boolean((loginResult as any).needsOnboarding);
    const tokenToStore = (loginResult as any).token as string | undefined;

    // Send token to frontend through localStorage and redirect.
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting...</title>
  </head>
  <body>
    <script>
      try {
        var token = ${JSON.stringify(tokenToStore || "")};
        if (token) localStorage.setItem('token', token);
        var needsOnboarding = ${JSON.stringify(needsOnboarding)};
        var params = new URLSearchParams(window.location.search);
        if (needsOnboarding) params.set('onboarding', '1');
        window.location.href = '${frontendOrigin}/auth';
      } catch(e) {
        window.location.href = '${frontendOrigin}/auth';
      }
    </script>
  </body>
</html>`;


    res.status(200).type("html").send(html);
  } catch (error) {
    next(error);
  }
};


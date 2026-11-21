# Google OAuth setup

AuthKit uses Google’s server-side OAuth authorization-code flow. Google sends the code to the AuthKit backend, not the React client; the backend then creates AuthKit’s normal HttpOnly refresh session.

## 1. Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Use the project picker in the top bar, choose **New Project**, name it `AuthKit Local`, and create it.
3. Select that project after creation.

## 2. Configure the consent screen

1. Open **Google Auth platform** → **Branding**.
2. Enter `AuthKit` as the app name and select a support email.
3. Add your email as the developer contact and save.
4. In **Audience**, choose **External** for personal Gmail testing. Add your own Gmail address under **Test users** while the app is in testing mode.
5. In **Data Access**, AuthKit only needs the OpenID Connect scopes `openid`, `email`, and `profile`; these are requested by the backend.

## 3. Create the web OAuth client

1. Open **Google Auth platform** → **Clients**.
2. Select **Create Client**.
3. Choose application type **Web application**.
4. Give it a clear name such as `AuthKit localhost`.
5. Under **Authorized redirect URIs**, add this exact value:

   ```text
   http://localhost:5000/api/auth/google/callback
   ```

6. Create the client. Copy the Client ID and Client Secret shown by Google.

The callback must match character-for-character—including scheme, port, path, and trailing slash behavior—or Google returns `redirect_uri_mismatch`.

## 4. Configure AuthKit

In the backend `.env` file, add the values you copied. Do not put the client secret in `client/`, browser storage, or a frontend environment file.

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
```

Restart the backend after saving `.env`:

```powershell
npm run dev
```

## 5. Test in the browser

1. Open `http://localhost:5173`.
2. Choose **Sign in**.
3. Choose **Continue with Google**.
4. Select one of the Google accounts added as a test user, review the consent screen, and continue.
5. Google returns to the backend callback; AuthKit sets its HttpOnly refresh cookie and redirects you back to the dashboard.

## Production

Create a separate OAuth client or add the production callback URI to the existing one, for example `https://api.example.com/api/auth/google/callback`. Update both `GOOGLE_CALLBACK_URL` and `CLIENT_URL` to HTTPS production values. Do not reuse local secrets in public repositories.

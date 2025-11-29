# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a1e492a3-48cf-492c-b367-a5145f29598e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a1e492a3-48cf-492c-b367-a5145f29598e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a1e492a3-48cf-492c-b367-a5145f29598e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Instagram Basic Display API integration

This repo now ships with a serverless Instagram integration backed by `/api/instagram`. It stores long-lived Basic Display tokens in `data/instagram-tokens.json` (or a custom path via `IG_TOKEN_PATH`) so you can support hundreds of public accounts without copying tokens into the frontend.

1. **Create an Instagram Basic Display App** → Configure a valid OAuth redirect such as `https://samuisocial.com/api/instagram/callback`.
2. **Expose credentials** → Add `IG_CLIENT_ID` and `IG_CLIENT_SECRET` to your Vercel/Env config (plus `IG_TOKEN_PATH` if you prefer a custom storage location).
3. **Run the OAuth flow per account** → Send users through `https://api.instagram.com/oauth/authorize?client_id=...&redirect_uri=...&scope=user_profile,user_media&response_type=code`. When Instagram redirects back with `?code=`, POST it to the function:
   ```sh
   curl -X POST https://samuisocial.com/api/instagram \
     -H "Content-Type: application/json" \
     -d '{"code":"<CODE_FROM_INSTAGRAM>","redirectUri":"https://samuisocial.com/api/instagram/callback"}'
   ```
   The function exchanges the code for a long-lived token, refreshes it when 60-day expiry nears, and saves the entry (user id + username) into `instagram-tokens.json`.
4. **Fetch media anywhere in the app** → Call `/api/instagram?username=samuisocial&limit=9`. The serverless function automatically refreshes expiring tokens, so you can loop over as many registered accounts as you like (e.g., via a cron job) without hitting the client with secrets. Response payload:
   ```json
   {
     "account": { "userId": "17841400000000", "username": "samuisocial", "expiresAt": 1740700000000 },
     "media": [{ "id": "...", "media_url": "...", "caption": "...", "permalink": "..." }]
   }
   ```

You can also seed accounts manually by POSTing `userId`, `username`, `accessToken`, and `expiresAt`, which is handy if you already hold long-lived tokens.

### Command-line helper

Run `node scripts/register_instagram_account.mjs` to be guided through the OAuth flow directly from your terminal. The script:

- Reads `IG_CLIENT_ID`, `IG_CLIENT_SECRET`, `IG_REDIRECT_URI`, and `IG_TOKEN_PATH` when available (it will prompt otherwise). We recommend setting `IG_REDIRECT_URI=http://localhost:4815/instagram/callback` in both your environment and the Meta app so the helper can auto-capture the authorization code.
- Opens the Instagram consent screen in your browser and spins up a temporary localhost listener to grab the `?code=` that Instagram sends back.
- Exchanges the code for a long-lived token, looks up the account’s username/user id, and appends it to `data/instagram-tokens.json`.

After the script reports success, you can immediately query `/api/instagram?username=<handle>`—no manual curl steps required.

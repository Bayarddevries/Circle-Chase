# PWA Implementation Plan

## Goal

Turn Chase Tag into a Progressive Web App that can be installed on mobile home screens and works offline. This is the foundation for the TWA → Play Store path.

**Effort:** 2-3 hours
**New packages:** `vite-plugin-pwa` (runtime dep, ~0 bytes to bundle — it generates a SW at build time)

---

## Step 1: Install vite-plugin-pwa

```bash
cd /home/bayarddevries/Circle-Chase
npm install vite-plugin-pwa --save
```

This is the only new npm package. It adds ~1KB to the production bundle (the SW registration code). The service worker itself is generated at build time.

---

## Step 2: Update vite.config.ts

Add the PWA plugin and configure it:

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const isGithubPages = process.env.GITHUB_PAGES === 'true';
  return {
    base: isGithubPages ? '/Circle-Chase/' : '/',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico'],
        manifest: {
          name: 'Chase Tag',
          short_name: 'ChaseTag',
          description: 'Turn-based physics chase game. Outsmart. Outrun. Outplay.',
          theme_color: '#020502',
          background_color: '#020502',
          display: 'fullscreen',
          orientation: 'landscape',
          scope: '/',
          start_url: '/',
          categories: ['games', 'entertainment'],
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // Cache the entire app for offline play
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
          // Skip waiting so the new SW activates immediately
          skipWaiting: true,
          clientsClaim: true,
        },
        devOptions: {
          enabled: false, // Don't register SW in dev mode
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```

### Key manifest decisions

| Field | Value | Rationale |
|---|---|---|
| `display` | `fullscreen` | Game should take the entire screen, no browser chrome |
| `orientation` | `landscape` | Game canvas is landscape; prevents awkward portrait mode |
| `theme_color` | `#020502` | Matches game background; status bar blends in |
| `scope` | `/` | Required for TWA — must match the deployed URL scope |
| `purpose` | `any maskable` | Android will mask the icon to fit its shape system |

---

## Step 3: Create App Icons

Create `public/icons/` directory with two PNG icons:

- `icon-192.png` — 192×192 pixels
- `icon-512.png` — 512×512 pixels

### Icon design spec

- **Background:** Solid `#020502` (matches theme_color)
- **Foreground:** Two overlapping circles — amber (#d97706) and cyan (#38bdf8) — representing Hider and Seeker
- **Style:** Simple, flat, no text (text is unreadable at small sizes)
- **Padding:** 10% safe zone around the design (for maskable cropping)
- **Format:** PNG with transparency (though background should be opaque)

### Quick generation command (if ImageMagick is available)

```bash
mkdir -p public/icons
# Generate a simple placeholder — replace with proper design later
# For now, any 192x192 and 512x512 PNG with the right colors works
```

**Note:** The icons can be updated later without changing any code. The manifest just references the file paths.

---

## Step 4: Add Meta Tags to index.html

Update `index.html` to include PWA meta tags:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#020502" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Chase Tag" />
  <meta name="description" content="Turn-based physics chase game. Outsmart. Outrun. Outplay." />
  <meta name="mobile-web-app-capable" content="yes" />
  <link rel="icon" type="image/png" href="/icons/icon-192.png" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <title>Chase Tag</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

### Viewport note

`maximum-scale=1.0, user-scalable=no` prevents pinch-to-zoom which would break the canvas DPI scaling. This is standard for canvas-based games.

---

## Step 5: Handle "Add to Home Screen" Prompt (Optional)

The browser shows the install prompt automatically when the PWA criteria are met. To control when it shows, add a beforeinstallprompt handler:

```typescript
// src/hooks/useInstallPrompt.ts
import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as any).prompt();
    const result = await (installPrompt as any).userChoice;
    setInstallPrompt(null);
    setIsInstallable(false);
    return result;
  };

  return { isInstallable, promptInstall };
}
```

Use in MainMenu to show an "Install App" button when `isInstallable` is true.

---

## Step 6: Handle Offline State

Add a simple offline indicator so players know the game works without internet:

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

Show a subtle "offline" badge in the HUD if needed. The game is fully local so offline play is identical to online.

---

## Step 7: Build and Verify

```bash
npm run build
```

Expected output:
- `dist/manifest.webmanifest` — auto-generated
- `dist/sw.js` — auto-generated service worker
- `dist/registerSW.js` — auto-generated SW registration
- All assets cached per workbox config

### Verification checklist

- [ ] Build passes with zero errors
- [ ] `dist/manifest.webmanifest` exists and has correct name/icons
- [ ] `dist/sw.js` exists
- [ ] `npm run preview` — open in Chrome
- [ ] Chrome DevTools → Application → Manifest shows correct values
- [ ] Chrome DevTools → Application → Service Workers shows SW registered
- [ ] Chrome DevTools → Application → Cache Storage shows cached assets
- [ ] Lighthouse PWA audit scores 100%
- [ ] "Add to Home Screen" prompt appears (may need to trigger via DevTools)
- [ ] Game works after going offline (DevTools → Network → Offline)
- [ ] `npm run build` with `GITHUB_PAGES=true` also works (base path)

---

## Step 8: Deploy to GitHub Pages

The existing deploy workflow already handles this. After pushing:

1. GitHub Actions builds with `GITHUB_PAGES=true`
2. The `base: '/Circle-Chase/'` path kicks in
3. SW and manifest deploy to `https://bayarddevries.github.io/Circle-Chase/`

### Post-deploy verification

- Visit the GitHub Pages URL
- Check DevTools → Application → Service Workers (should show active SW)
- Check DevTools → Application → Cache Storage (should show cached files)
- Test "Add to Home Screen" on mobile Chrome
- Test offline play on mobile

---

## File Summary

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modify | Add `vite-plugin-pwa` dependency |
| `vite.config.ts` | Modify | Add VitePWA plugin with manifest + workbox config |
| `index.html` | Modify | Add meta tags, manifest link, viewport settings |
| `public/icons/icon-192.png` | Create | App icon 192×192 |
| `public/icons/icon-512.png` | Create | App icon 512×512 |
| `src/hooks/useInstallPrompt.ts` | Create | Optional: controlled install prompt |
| `src/hooks/useOnlineStatus.ts` | Create | Optional: offline indicator |

---

## Constraints

- **Only 1 new npm package:** `vite-plugin-pwa`
- **No changes to game logic.** Purely build/config + meta tags.
- **No `any` types.** Full TypeScript.
- **Build must pass** before marking complete.
- **Dev mode SW disabled.** `devOptions: { enabled: false }` prevents SW from interfering with HMR.
- **GitHub Pages compatible.** The `base` path is already handled by the existing `GITHUB_PAGES` env var.

---

## Post-PWA: TWA Path (Future)

Once PWA is deployed and verified:

1. Install Bubblewrap: `npm install -g @anthropic/bubblewrap`
2. Initialize: `bubblewrap init --manifest https://bayarddevries.github.io/Circle-Chase/manifest.webmanifest`
3. Build: `bubblewrap build` → produces signed APK + AAB
4. Submit AAB to Google Play Console

This is a separate task — the PWA work here is the prerequisite.

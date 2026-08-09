# ELISHEN AGRIVANCE — Sales & Inventory Management System

One PostgreSQL database + one Node API on the office PC, consumed by three clients:
the **web app** (any browser on the LAN), the **Android app** (Capacitor), and the
**desktop app** (Electron). This README covers building the shareable installers
and the path to iOS / a Cloudflare domain.

---

## 1. The server (already set up on this PC)

| Piece | How it runs |
|---|---|
| PostgreSQL 17 | Windows service `postgresql-x64-17`, **Automatic** start |
| API + web UI | Scheduled task **ElishenBackend** at logon (hidden window), port **3001** |
| Nightly backup | Scheduled task **ElishenBackup**, 9:00 PM daily → `db/backups/auto/` (30-day retention, syncs via OneDrive) |
| Firewall | Inbound TCP 3001 allowed ("Elishen Agrivance API 3001") |

Manual restart if ever needed:
```bat
schtasks /Run /TN "ElishenBackend"
```
Manual backup: run `db\backup.cmd`. Restore:
```bat
pg_restore -U postgres -d bookkeeping --clean --if-exists db\backups\auto\<file>.dump
```

---

## 2. Android APK — shareable with employees

Prereq: Android Studio (with SDK) installed. All web changes must be synced first:

```bat
cd capacitor
npx cap sync android
```

### Quick shareable APK (debug — fine for internal staff)
```bat
cd capacitor\android
gradlew assembleDebug
```
Output: `capacitor\android\app\build\outputs\apk\debug\app-debug.apk`

Share that file via Messenger/Drive/USB. On the phone: allow
"Install unknown apps" for the browser/file manager, then open the APK.

### Signed release APK (recommended once things settle)
1. Create a keystore **once** (keep it forever — losing it means users must uninstall/reinstall):
   ```bat
   keytool -genkey -v -keystore elishen.keystore -alias elishen -keyalg RSA -keysize 2048 -validity 10000
   ```
   Store `elishen.keystore` somewhere safe (NOT in git — it's ignored).
2. In Android Studio: **Build → Generate Signed Bundle / APK → APK**, pick the keystore, choose `release`.
3. Output: `app\build\outputs\apk\release\app-release.apk` — share the same way.

First launch on any phone: tap **Change** on the login screen and enter the server
address (`http://192.168.0.100:3001` on the shop Wi-Fi — or the Cloudflare URL, see §5).

---

## 3. Desktop installer for the owners (Electron)

```bat
cd electron
npm install        # first time only
npm run dist
```
Output: `electron\dist\Elishen Agrivance Setup <version>.exe` — a normal Windows
installer (NSIS) with the ES icon. Share the .exe; owners double-click to install.
The app opens the bundled UI and talks to the same server (set the server address
once in Settings → API address, or on the login screen).

> Note: `npm run dist` bundles the web app **as it is on disk** — rebuild after UI changes.

---

## 4. iOS for Henry & Katherine (two options)

**Option A — PWA via the Cloudflare domain (recommended, no Mac needed).**
Once the system is on HTTPS (see §5), Safari gets full camera + GPS access:
1. On the iPhone, open `https://your-domain` in Safari.
2. Share button → **Add to Home Screen**.
It behaves like an app: full screen, ES icon, login remembered. This is the
practical route — Apple requires a Mac + $99/yr developer account for a real app.

**Option B — native iOS app (requires a Mac with Xcode).**
```bash
cd capacitor
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
npx cap open ios      # opens Xcode: set signing team, then run/archive
```
Add to `ios/App/App/Info.plist`: `NSCameraUsageDescription` and
`NSLocationWhenInUseUsageDescription` (attendance selfie + geotag).
Distribution to just the two owners can use Ad Hoc or TestFlight.

---

## 5. Cloudflare domain (planned)

The clean way to expose the shop server safely is **Cloudflare Tunnel** — no port
forwarding, free HTTPS:

```bat
winget install Cloudflare.cloudflared
cloudflared tunnel login
cloudflared tunnel create elishen
cloudflared tunnel route dns elishen app.yourdomain.com
cloudflared tunnel run --url http://localhost:3001 elishen
```
(Then install it as a service: `cloudflared service install` with a config file.)

After that:
- Phones/desktops anywhere use `https://app.yourdomain.com` as the server address
- iOS Safari + Android browsers get camera/GPS (HTTPS = secure context)
- The Android APK keeps working — just change the server address on the login screen
- **Before going public**: finish the auth-token + hashed-PIN upgrade — an
  internet-exposed API must not rely on the current header-based identity.

---

## 6. Day-to-day update workflow

| Changed | Do |
|---|---|
| Web UI (`app/`) | Nothing for browsers (server serves it live). For the APK: `npx cap sync android` + rebuild/share APK. For Electron: `npm run dist` again. |
| Backend (`backend/`) | `schtasks /Run /TN "ElishenBackend"` after killing the old process (or reboot). |
| Database schema | Keep `db/schema.sql` in sync; backups run nightly regardless. |

## 7. Repo notes

`.gitignore` excludes secrets (`backend/.env`), `node_modules`, build outputs,
database backups, and the generated Android web assets. Safe to `git init` and push.

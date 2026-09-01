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

## 4. iOS for Henry & Katherine — native app

The system is distributed as installed apps on every platform (no public website).
For iOS that means the native Capacitor app — **this requires a Mac with Xcode
and an Apple Developer account ($99/yr)**; there is no way around Apple's rules.
```bash
cd capacitor
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
npx cap open ios      # opens Xcode: set signing team, then run/archive
```
Add to `ios/App/App/Info.plist`: `NSCameraUsageDescription` and
`NSLocationWhenInUseUsageDescription` (attendance selfie + geotag).
Distribution to just the two owners: **TestFlight** (easiest) or Ad Hoc with
their device UDIDs. No Mac available? A cloud Mac (MacinCloud/Codemagic CI)
can do the build — or, as a stopgap only, the HTTPS web app on Safari works,
but the goal is app-only.

## 4b. App-only lockdown (after everyone has the apps)

Set in `backend\.env`:
```
APP_ONLY=1
```
and restart the backend. The server then serves **no web UI at all** — browsers
get a 404; only the installed apps (which carry their own bundled UI) can use
the system. Do this only AFTER the APK and desktop installer are distributed,
or office browser access dies immediately.

> Note: the API is protected by **login tokens + hashed PINs** — every request
> (even reads) needs a valid session token from `/api/login`; PINs are stored
> scrypt-hashed; sessions live 30 days (sliding) and die on logout, PIN change,
> or deactivation. App-only mode is now just cosmetic (hides the browser UI).

---

## 5. Cloudflare domain (LIVE)

The server is exposed at **https://elishenagrivance.com** (and `www.`) through a
Cloudflare Tunnel — no port forwarding, free HTTPS. Setup on the server PC:

- Tunnel `elishen` (`8cee011b-1707-4b19-9f37-75db437bd716`), created with
  `cloudflared tunnel login/create/route dns`
- Windows service **Cloudflared** (Automatic start, auto-restart on crash) runs
  `cloudflared tunnel run` with config + credentials in
  `C:\Windows\System32\config\systemprofile\.cloudflared\`
  (a user-profile copy for manual runs is in `C:\Users\User\.cloudflared\`)

Client notes:
- Phones/desktops anywhere use `https://elishenagrivance.com` as the server
  address — the app defaults to it (browser UI talks to its own origin)
- iOS Safari + Android browsers get camera/GPS (HTTPS = secure context)
- The auth-token + hashed-PIN upgrade is done — identity comes from the session
  token, never from a client-supplied header.

---

## 5b. Customer Information Sheets

The paper CIS is now a page in the app (**Customer Info Sheets** in the sidebar),
available to **every signed-in user** — not just admins — because the field reps
are the ones who collect it. Two variants, matching the two paper forms:

- **Store** — includes the *If corporation / cooperative* block (Store Manager /
  OIC names and addresses)
- **Farm** — same sheet without that block; wording changes to "Farm established
  on" / "Complete Farm Address"

Each sheet stores the address broken into its printed parts (No., Street, Purok,
Barangay, Town, City, Province), both owners' names split Surname / Given /
Middle, terms with the Credit and Check boxes, bank and branch, six signature
specimens (typed name plus an optional on-screen signature), and the customer's
certifying signature. **Print / Save as PDF** reproduces the form exactly, so a
filled sheet and a blank one are the same document.

Sheets can be opened from anywhere a customer appears: the customer list and the
Statement-of-Account header on **Receivables**, and each visited store on **Store
Visits**. A sheet may be linked to a customer record so both stay together.
Staff may create and update sheets; deleting one is admin-only.

## 6. Day-to-day update workflow

| Changed | Do |
|---|---|
| Web UI (`app/`) | Nothing for browsers (server serves it live). For the APK: `npx cap sync android` + rebuild/share APK. For Electron: `npm run dist` again. |
| Backend (`backend/`) | `schtasks /Run /TN "ElishenBackend"` after killing the old process (or reboot). |
| Database schema | Keep `db/schema.sql` in sync; backups run nightly regardless. |

## 7. Repo notes

`.gitignore` excludes secrets (`backend/.env`), `node_modules`, build outputs,
database backups, and the generated Android web assets. Safe to `git init` and push.


levomax 36x5 - 16

spectrum 96x5 - 17

iron dextran 12x100ml - 6 + 1(opened 8 left)

robicomject 12x100ml - 7 + 1(opened 11 left)

spectrum plus 96x5g - 18

cotrimazine tripulac 24x 100ml - 6 + 1(opened 4 left)

wormbuster 36pcs x 5g - 19box

top b+ 36x60ml - 17box+1box(opened 31 left)

wheat germ 12x300g - 6box + 1box (opened  9 left)

coccibuster - 36pcsx5 - 16 box

robi la 12x100ml - 8box

robipenstrep 48x1dose - 1box

robipenstrep 96x5g - 14box

top b+ 18x120ml - 20box

shampooch 12botx300ml - 8box

shampooch 16boxes x (15mlx25sachets) - 7box + 1box (opened 14 left)

robi la 12x100ml - 8box + 1box (opened 5 left)

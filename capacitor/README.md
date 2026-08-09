# Mobile build (Capacitor)

The mobile app is the same `app/` UI wrapped by Capacitor. It talks to the
office API server over the LAN — set the API address in the app's Settings
screen (e.g. `http://192.168.1.50:3001`).

## One-time setup

```bash
cd capacitor
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
```

(For iOS you need a Mac: `npm install @capacitor/ios && npx cap add ios`.)

## Each build

```bash
npx cap sync
npx cap open android   # opens Android Studio → Run ▶ on a device
```

`cleartext: true` in `capacitor.config.json` allows plain-HTTP LAN calls to the
API server; remove it if you later put the API behind HTTPS.

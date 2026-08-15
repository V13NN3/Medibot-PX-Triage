This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Doctor Is Out (Flutter app) — new repo at ~/Documents/medibot-doctor-out, pushed to github.com/julius-sobersynq/Medibot-Doctor-Out
- Screens: Connect (enter clinic IP) → Select your doctor profile → Standby ("waiting for calls") → Incoming call (accept/decline) → live call (local preview, remote video, mute/camera/end).
- Uses flutter_webrtc + web_socket_channel; flutter analyze clean; iOS simulator build succeeded.
To test on your LAN:
1. On the clinic machine: npm run relay:telehealth (alongside next + relay), open firewall port 3004.
2. Kiosk Chrome must access the app at http://localhost:3000 (camera/mic requires a secure context — a plain http://192.168… page blocks getUserMedia).
3. Open the Doctor app, enter http://<clinic-ip>:3000, pick your profile, leave it on standby.
4. On the kiosk, open Telehealth → Call that doctor.
Note: the doctor's phone must stay on the app to receive calls (no push notifications in this MVP).

git pull & npm run build & npm run https:prod
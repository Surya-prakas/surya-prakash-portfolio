# Setup

This is a scaffolded Next.js (App Router) project with your real portfolio
content already wired in.

## 1. Create the project shell

If you haven't already, create a Next.js app, then copy these files in
(overwriting the defaults):

```bash
npx create-next-app@latest surya-portfolio
cd surya-portfolio
```

Copy in: `app/`, `components/`, `public/` (see below), and merge
`package.json` dependencies into the generated one.

## 2. Install dependencies

```bash
npm install
```

## 3. Environment variables

Create `.env.local` in the project root:

```
NVIDIA_API_KEY=your_key_here
```

Get a key from [build.nvidia.com](https://build.nvidia.com) (NVIDIA's NIM
catalog). Never commit this file.

The default model in `route.js` is `meta/llama-3.1-8b-instruct` — swap the
`MODEL` constant at the top of that file for any other instruct model listed
on build.nvidia.com if you'd prefer a different one (larger models will be
slower but may give better answers).

## 4. Add the Nova frame sequence

`RobotCompanion.jsx` is a canvas scroll-scrubbed frame sequence (it replaced
an earlier 4-pose sprite-swap, so the old `robot-idle/wave/point/think.png`
files are no longer used). It expects 120 transparent PNG frames plus a pose
manifest:

```
public/companion/nova-frames/frame_001.png … frame_120.png
public/companion/nova-frames/nova-pose-manifest.json
```

Frames must be named `frame_NNN.png`, zero-padded to 3 digits, 1-indexed —
`RobotCompanion.jsx` builds the paths from that pattern and preloads all 120
before wiring up the scroll listener. Keep them RGBA (transparent
background) and 960×540; they're drawn into a 480×270 canvas, so anything
larger is wasted bytes.

`nova-pose-manifest.json` maps frame ranges to poses and the speech-bubble
copy that rides along with each:

```json
{
  "totalFrames": 120,
  "poses": {
    "idle":    { "range": [1, 15],    "message": "Hey, I'm Nova 👋" },
    "point":   { "range": [16, 40],   "message": "Check this out!" },
    "think":   { "range": [41, 65],   "message": "Let me think about that..." },
    "wave":    { "range": [66, 90],   "message": "Great to see you here!" },
    "excited": { "range": [91, 120],  "message": "This is my favorite part!" }
  }
}
```

The `think` range is also what the companion pins to while a chat request is
in flight. Note the range boundaries are a first-pass estimate derived from
downsampled contact sheets — expect to retune them (and the messages) against
the full-res frames.

The 3D Nova at the top of the page is a hosted Spline scene, not a local
asset — its URL is the `SCENE_URL` constant in `HeroRobot3D.jsx`.

## 5. Project screenshots

Move the `project-assets/` folder into `public/project-assets/` so the
image paths referenced in `page.js` (e.g.
`/project-assets/fraud-detection/roc.png`) resolve correctly.

Keep these web-sized — around 1600px wide at JPEG quality ~80 is plenty for
chart screenshots. They're rendered at `width: 100%` inside project cards,
so multi-thousand-pixel exports straight out of matplotlib are pure waste.

## 6. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

## What's included

- `app/page.js` — full homepage, all sections, your real content
- `app/layout.js` — root layout with fonts + the robot/chat layer
- `app/globals.css` — dark theme, Geist fonts, design tokens
- `app/api/chat/route.js` — NVIDIA NIM-backed chat assistant endpoint
- `components/HeroRobot3D.jsx` — hosted Spline 3D Nova (lazy-loaded, top of page)
- `components/RobotCompanion.jsx` — canvas scroll-scrubbed frame sequence (GSAP)
- `components/CinematicNovaIntro.jsx` — pinned intro sequence
- `components/ChatWidget.jsx` — floating chat UI
- `components/CompanionLayer.jsx` — connects the companion + chat
- `components/RobotHandoffContext.jsx` — 3D ⇄ 2D Nova handoff state
- `components/TerminalHero.jsx` — typewriter terminal hero section
- `components/NovaStatus.jsx` — "currently working on" status widget

## Still to do

- Push a live URL and swap this into your resume/LinkedIn
- Add a profile photo if you decide to use one (currently text-only design)
- Consider adding the HireSync local-run screenshots to that project card
- Run Lighthouse once deployed and check mobile responsiveness
- Retune the pose ranges in `nova-pose-manifest.json` against the full-res frames
- Migrate the project screenshots from raw `<img>` to `next/image`
- Decide how the large frame/screenshot assets enter git (Git LFS vs external hosting)

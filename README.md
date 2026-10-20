# Dominyx

A family of single-purpose Discord bots, sharing one core package. Each bot lives in `packages/` and deploys independently to Railway. Hub: **Dominyx HQ**.

## Members

| Bot | Package | Purpose |
| --- | --- | --- |
| Dominyx Music | `packages/music` | Lavalink music player: play, queue, skip, stop, loop, shuffle, volume, nowplaying, 24/7, personal playlists |
| Dominyx Level | `packages/level` | XP leveling, rank cards, leaderboards, level roles, level-up announcements |
| Dominyx Greet | `packages/greet` | Crimson/black welcome cards, custom welcome text, auto-roles |
| Dominyx Ticket | `packages/ticket` | Ticket panels, categories, claim/priority, transcripts to log channel |
| Dominyx Ticket | `packages/ticket` | Ticket panels, categories, claim/priority, transcripts to log channel |
| Dominyx Ping | `packages/ping` | YouTube "went live" alerts (needs `YOUTUBE_API_KEY`) |
| Dominyx Guard | `packages/guard` | Moderation: ban/kick/warn, case history, staff notes, bulk ban, self-assignable roles, mod-log channel |
| Dominyx HQ | `packages/hq` | Web dashboard (Next.js): landing, guild picker, config UI for every bot. Deploy to Vercel. |

Planned: Dominyx HQ (web dashboard).

## Setup

The complete guide, from creating the Discord applications to deploying every
bot and the dashboard, is in the dashboard repository:

<https://github.com/adixlucifer0011/aurex-discord-bots/blob/main/docs/SETUP_GUIDE.md>

Quick reference for the bot network:

| Bot | Package | Start | Commands |
|---|---|---|---|
| Music | `packages/music` | `npm run start:music` | `/play` `/queue` `/skip` `/volume` `/247` and more |
| Level | `packages/level` | `npm run start:level` | `/rank` `/leaderboard` `/levelconfig` |
| Greet | `packages/greet` | `npm run start:greet` | `/greetsetup` |
| Ticket | `packages/ticket` | `npm run start:ticket` | `/ticketsetup` `/ticketpanel` |
| Ping | `packages/ping` | `npm run start:ping` | `/pingsetup` |
| Guard | `packages/guard` | `npm run start:guard` | `/ban` `/kick` `/warn` `/cases` `/guardsetup` and more |

Every bot needs `BOT_TOKEN`, `CLIENT_ID` and `DATABASE_URL`. Register the
slash commands once with `npm run deploy:music` and the rest.

## Repo layout

```
packages/
  core/    @dominyx/core — shared command loader, deploy, embeds, Postgres pool
  music/   dominyx-music — the music bot
  level/   dominyx-level — the leveling bot
  greet/   dominyx-greet — the greeting bot (fonts live in packages/greet/fonts — swap the .ttf files to rebrand)
  ticket/  dominyx-ticket — the ticket bot
  ping/    dominyx-ping — the YouTube live-alert bot
  guard/   dominyx-guard — the moderation bot
  hq/      dominyx-hq — web dashboard (Vercel)
```

## Bots setup

1. `npm install`
2. Copy `.env.example` in each bot (or the root) and fill in `BOT_TOKEN`, `CLIENT_ID`, `LAVALINK_*`. (`DATABASE_URL` needed for leveling, greetings, 24/7 mode, tickets, moderation; `YOUTUBE_API_KEY` + `YOUTUBE_POLL_MINUTES` for live alerts.)
3. Deploy commands: `npm run deploy:music` / `npm run deploy:level` / `npm run deploy:greet` / `npm run deploy:ticket` / `npm run deploy:ping` / `npm run deploy:guard`
4. Run: `npm run start:music` / `npm run start:level` / `npm run start:greet` / `npm run start:ticket` / `npm run start:ping` / `npm run start:guard`

## Web dashboard (Dominyx HQ)

1. Copy `packages/hq/.env.example` → `packages/hq/.env.local` and fill in `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `BOT_TOKEN`, `DATABASE_URL` (the same Postgres the bots use) + `DISCORD_REDIRECT_URI` / `PUBLIC_APP_URL`.
2. Local dev: `npm run dev:hq`
3. Deploy to Vercel (set **root directory = `packages/hq`**, install command `npm install`, no build step needed — Vercel auto-detects Next.js).

## Dashboard connection

The Dominyx web dashboard (<https://github.com/adixlucifer0011/dominyx-discord-bots>) writes configuration straight into the same Postgres database these bots read. Every module owns one table:

| Module | Table |
| --- | --- |
| Music | `music_settings` |
| Level | `level_config` |
| Greet | `greet_settings` |
| Ticket | `ticket_config` |
| Ping | `ping_settings` |
| Security | `guard_settings` |

Each table carries an `enabled` column, which is the module on/off switch. `@dominyx/core` reads it for you:

```js
const { isModuleEnabled, requireModuleEnabled, setModuleEnabled } = require('@dominyx/core');

if (!(await isModuleEnabled(guildId, 'music'))) return;       // in an event handler
if (!(await requireModuleEnabled(interaction, 'music'))) return; // in a command
await setModuleEnabled(guildId, 'music', false);                // flip the switch
```

- `requireModuleEnabled` replies with an ephemeral "module is disabled" notice and returns `false`, so you can put it at the top of an interaction handler.
- Reads are cached for 15 seconds (`DOMINYX_SETTINGS_TTL_MS`) so per-message handlers do not hit the database on every message. Dashboard changes land within that window.
- A database error fails **open**: a database hiccup never switches a bot off.

Every bot also gets a shared `/module` command — `/module status`, `/module enable`, `/module disable` — so admins can flip the switch from Discord. It writes the same column the dashboard writes, so both sides stay in sync.

To use the dashboard, point it at the same `DATABASE_URL` and set the same `BOT_ID_*` application IDs. The dashboard creates the tables and the `enabled` column automatically.

## Tests

```bash
npm test
```

Covers the module switch: defaults, read/write, caching, fail-open behaviour, and the interaction guard.

## Conventions

- CommonJS `require`/`module.exports` — never ESM.
- Slash commands export `{ data: SlashCommandBuilder, execute(interaction, client) }`; run deploy after adding/modifying.
- Events export `{ name, once?, execute(...args, client) }`; no deploy needed.
- Shared code goes in `@dominyx/core`; per-bot state uses its own Postgres table via `init*` functions in that bot's `events/ready.js`.
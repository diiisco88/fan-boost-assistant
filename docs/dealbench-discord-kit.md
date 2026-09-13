# DealBench Discord: full server kit

Copy-paste ready. Discord only lets the owner create a server, so step 1 is on you. Everything after that is paste-and-go.

**Founding spots left: 18.** Search this doc for `18` and update it everywhere when the number moves.

---

## 1. Create the server (2 min)

1. Discord sidebar, hit `+` → "Create My Own" → "For a club or community"
2. Name it **DealBench HQ**
3. Upload a server icon (reuse the site logo or avatar)
4. Server Settings → build out the categories and channels below

---

## 2. Categories & channels

Build in this order, drag to reorder after. For each channel: gear icon → set the Channel Topic to the text listed.

### START HERE

| Channel | Topic |
| --- | --- |
| `#welcome` | what dealbench is + how to get founding-member access |
| `#rules` | read before posting |
| `#introductions` | say hi. niche, platform, follower range, whatever you want to share |

### THE BENCH

| Channel | Topic |
| --- | --- |
| `#rate-check` | got an offer and don't know if it's fair? drop it here, no names needed |
| `#submitted-rates` | rates people have added to dealbench.io. celebrate your submission here |
| `#niche-talk` | general chat about rates and deals in your specific niche |

### GROWING AS A CREATOR

| Channel | Topic |
| --- | --- |
| `#negotiation-tips` | what's worked when pushing back on a lowball offer |
| `#brand-red-flags` | describe shady brand behavior. no naming brands directly, just the pattern, so we don't end up in a legal mess |
| `#wins` | landed a good deal using dealbench data? brag here |

### PLATFORM

| Channel | Topic |
| --- | --- |
| `#announcements` | site updates + founding member countdown |
| `#feedback-bugs` | something broken or annoying? tell us |
| `#suggestions` | what should dealbench build next |

### COMMUNITY

| Channel | Topic |
| --- | --- |
| `#general` | (none needed) |
| `#off-topic` | (none needed) |

### FOUNDING MEMBERS (private)

Server Settings → channel permissions → visible only to the "Founding Member" role.

| Channel | Topic |
| --- | --- |
| `#founding-lounge` | exclusive to the first 20 verified submitters. thanks for being early |

---

## 3. Welcome message

Pin this in `#welcome`.

> welcome to dealbench hq
>
> this is the community around dealbench.io, a free database of real brand deal rates, submitted by actual creators, sorted by niche and platform.
>
> most of us have taken a deal not knowing if the number was fair. that's the whole reason this exists. no more guessing.
>
> quick start:
>
> - check out #rules
> - say hi in #introductions
> - drop a rate you've been paid at dealbench.io, no name attached, and grab one of the last 18 free lifetime access spots (first 20 verified submissions only)
> - hang out in #rate-check if you've got an offer right now and want a gut check
>
> questions go to #feedback-bugs. glad you're here.
>
> hannah, founder

---

## 4. Rules

Pin this in `#rules`.

> dealbench hq rules
>
> 1. be real. rates you share should be real numbers you were actually paid or offered. this whole community only works if the data's honest.
> 2. no doxxing. don't post other people's real names, handles, or identifying info alongside rate or deal info unless they've shared it themselves.
> 3. describe brand behavior, don't accuse. flag red flags in #brand-red-flags by describing what happened, not by naming and shaming a brand directly.
> 4. no spam or unsolicited promo. self-promo is fine in #introductions, not everywhere else.
> 5. be decent. disagree about rates and negotiation all you want, just don't be a jerk about it.
> 6. mods can remove content or people who break these. that's rare, but it happens.

---

## 5. Roles

Server Settings → Roles → Create Role. Set color and name, then drag Founder to the top.

| Role | Color | Who gets it | Perms / notes |
| --- | --- | --- | --- |
| Founder | gold | you | admin |
| Mod | teal | anyone helping you moderate | manage messages, kick |
| Founding Member | orange | first 20 verified submitters | unlocks `#founding-lounge`, badge of honor |
| Verified Creator | green | anyone who's submitted a real rate | shows they've contributed |
| Newcomer | default gray | everyone on join | no special access |

---

## 6. Auto-assigning roles (optional)

Manual assignment is fine at your current size. 18 spots left total means this is a 10-second job per person once you see the submission on the backend.

When it grows, add **Carl-bot** (carl.gg), free tier:

- reaction roles: react with a check in `#welcome` to confirm rules read and unlock access
- auto-posting welcome messages

Setup: invite Carl-bot from carl.gg, then type `/reactionrole` in Discord and point it at the welcome message.

Skip for now if it feels like overkill. It probably is.

---

## 7. Founding member announcement

Post in `#announcements` once the server is live.

> 18 founding spots left.
>
> first 20 people to submit a real rate to dealbench.io get free lifetime access. no $12/mo, ever. no name required on the submission, just the numbers. once they're gone they're gone.
>
> drop yours → dealbench.io

---

## 8. Next step: live spots-left sync

Optional build. Instead of hand-editing the pinned number, a webhook on the DealBench backend posts to `#announcements` every time a new rate gets verified.

To wire it up, grab the webhook URL: channel settings → Integrations → Webhooks → New Webhook → Copy URL.

---

## Voice rules for future edits

- no em dashes
- no rhetorical questions
- no corporate verbs: unlock, empower, elevate, leverage
- casual, dry, matches @dealbenchhq

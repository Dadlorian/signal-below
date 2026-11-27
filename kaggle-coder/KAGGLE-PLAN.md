# Kaggle for my son and his friends: the plan

**Status: proposal. Nothing here is built or tested.** Facts checked 2026-11-26 from official
pages unless marked otherwise. Goal: each person has their own Kaggle account, and starting the
helper takes one command.

## 1. Gates: settle these first

| Gate | What was found |
|---|---|
| **Age** | Under 13: not allowed. Ages 13 to 16: Kaggle needs verifiable parental consent first. The parent makes an account, accepts the terms and files the form, then the teen signs up: https://www.kaggle.com/contact#/privacy/minor . Each friend's own parent does this. |
| **Accounts** | One active account per person. No sharing accounts or passwords. |
| **Terms** | https://www.kaggle.com/terms and https://www.kaggle.com/aup . No clause found that names tunnels or model servers. **That is not permission.** Use must be personal and non-commercial; the AUP bans resource abuse, server farming, activity that is not machine learning or data science, and circumvention. Whether this setup counts is a judgment call, and an account could be suspended. An unanswered user post calls this kind of setup abuse (a claim, not Kaggle's word): https://www.kaggle.com/discussions/product-feedback/743895 . Asking Kaggle is the way to know. |
| **Limits** | GPU: 30 hours a week, 12 hours a session. `server.py` stops after 3 hours, or 30 idle minutes. |
| **Phone** | A staff post says notebooks need phone verification; GPU and internet details come from user reports. |

## 2. What blocks "API key and command"

1. **Secrets.** Kaggle's command line cannot attach Kaggle Secrets, and a user guide reports that
   pushed runs cannot read them. So today's `server.py` (key from a Secret) fits the web page,
   not a one-command launch.
2. **No stop command** was found. A run ends when the script ends or hits its time limit, or from
   the web page. `kaggle kernels delete` removes the notebook; whether it stops a run is unknown.
3. **Side panel.** Cline needs streaming. Cloudflare's docs say quick tunnels do not support it.
   A named tunnel needs a Cloudflare account and a domain. Cloudflare's privacy policy says its
   services are not intended for under-18s, so friends should not be sent to sign up. Corey making
   a tunnel for each friend would put a token for Corey's domain in each friend's account.

## 3. Proposed design: one command, a new key every time

Each person, on their own laptop and their own Kaggle account:

```
kc up
  1. makes a new random model key (never typed, never reused)
  2. writes it into a temporary copy of server.py, outside the game folder
  3. kaggle kernels push --accelerator NvidiaTeslaT4 -t 11400   (their own PRIVATE notebook)
  4. kaggle kernels logs <their-name>/kaggle-coder --follow     (waits for the address)
  5. checks that a request without the key is refused
  6. shows the address, puts the key on the clipboard or hands it to the helper
  7. deletes the temporary copy
```

`-t 11400` is 3 hours plus 10 minutes for startup.

**The trade-off to accept or reject:** the key would sit in that private notebook's version history
on Kaggle, not in a Secret. This changes the current rule "the key lives only in the Secret and on
the laptop". What limits the damage: each key is for one session, each person has their own, and
it stops working when that server stops. Someone who got into the account while a server was
running could read it. Never make the notebook public.

**The "API key" each person needs** is their Kaggle sign-in: `kaggle auth login` (browser sign-in,
nothing to copy). That sign-in can control their whole Kaggle account, so it stays on their own
laptop and is never shared. Corey never collects it.

**One time per person:** parent consent if needed, Kaggle account, phone check, install the tools,
`kaggle auth login` (the CLI needs Python 3.11 or newer).

**Each session:** `kc up`.

**If the one-command design is rejected,** the fallback needs no Kaggle sign-in on the laptop:
set up the notebook and Secret once on the web page, then each session press Run and copy the
address.

## 4. Which helper

| | Aider (terminal) | Cline (side panel) |
|---|---|---|
| Works over a quick tunnel | designed to (no streaming) | not according to Cloudflare's docs |
| Cloudflare account | none | named tunnel and domain |
| Fits "friends run one command" | yes, if tested | only if streaming works over a quick tunnel |
| Seeing changes | asks before editing; `/diff` and VS Code Git history | diff before each approval |

**Recommendation:** run one test before choosing. `tests/smoke.sh` reports whether streaming works
through a quick tunnel (its notes mention a report that this was fixed, which conflicts with the
docs). If it works, test Cline on it, with a new address each session. If not, friends use Aider,
and Cline stays an option only for Corey's own named tunnel. Even if it works, it is not a
documented feature and could stop.

## 5. Order of work

- [ ] 1. Check each person's age. Get parental consent where needed.
      (2026-11-26: Corey confirms everyone is 13 or older. Still to do: consent for anyone 13 to 16,
      before they sign up.)
- [x] 2. Read the terms or ask Kaggle. Decide whether to go on.
      (2026-11-26: Corey decided to go ahead with a test. This is not a finding that Kaggle allows it.)
- [ ] 3. On Corey's account, by the web page (`docs/GUIDE-COREY-UBUNTU.md`, parts B and F), quick tunnel.
      Does the model load? Does `smoke.sh` pass? **Does streaming work?**
- [ ] 4. Try the command line by hand: push a harmless test script on GPU, then
      `kaggle kernels logs ... --follow`. Do live logs arrive? Does the run end when the script ends?
      (`logs` was seen in the CLI's source code, not in its command guide.)
- [ ] 5. Accept or reject the trade-off in part 3.
- [ ] 6. Build `kc up`: a setting in `server.py` for a per-session key, and the laptop command.
      Pin the `kaggle` package version and its hash in `PINS.md`.
- [ ] 7. Test with Corey's account, then the son's laptop, then one friend.

Open questions: how long each session takes to download the model (18.6 GB for profile A); whether
to keep the model in a private Kaggle dataset; whether Cline fits in the context window.

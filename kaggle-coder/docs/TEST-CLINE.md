# Test day: VS Code + Cline on Corey's Windows 11 laptop

Goal: find out, in about an hour, whether **Cline** (a chat panel in VS Code) works against the
model on Kaggle, and whether its permission controls are strong enough to hand to the teens.
Nothing here has been run.
Lines marked **[test this first]** are unconfirmed; write down what actually happens.

**Ground rules**
- Use **your own** Kaggle account and a **throwaway folder** (not the game repo, not a repo with
  anything private in it). Create it with `mkdir %USERPROFILE%\cline-test`, then `git init` inside.
- The key lives only in the Kaggle Secret `CODER_API_KEY` and in Cline's key box. Never in a file
  in that folder, a chat, a screenshot or a note. Rotate it when you finish (step 8).
- Read Kaggle's current terms first (https://www.kaggle.com/terms): serving a model through a
  tunnel may not be allowed. Your call.

---

## 0. Make a separate tunnel (once, Cloudflare dashboard)

Cline needs streaming, and Cloudflare's docs say quick tunnels do not support it
(https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/). Use your own named tunnel.
**Leave the game's tunnel and the server's `cloudflared` alone.**

1. Dashboard: **Networking > Tunnels**, create a **new** tunnel just for the helper.
2. Do **not** run the install command it shows on any of your computers. Copy only the token from
   it (the long value) into a Kaggle Secret named `KC_TUNNEL_TOKEN`.
3. In the new tunnel: **Routes > Add route > Published application**. Hostname: a new name used
   for nothing else. Service URL: `http://localhost:8080`.
4. Do not write the token or the hostname into any file in this repo.

The token is as sensitive as the key: whoever has it can serve your hostname and receive what
Cline sends there, **including the key**. If it may have leaked, replace the token or delete the
tunnel, and make a new key. Test on your own Kaggle account, and decide separately whether the
token should ever sit in anyone else's. A fixed hostname is not a secret; the key still protects
the server. Run one notebook at a time with the same token.

## 1. Start the server (Ubuntu or the Kaggle web page)

Follow **GUIDE-COREY-UBUNTU part J, steps 1 to 5** (key, private T4 x2 notebook with internet on,
paste `kaggle/server.py`, run, read the address). Tick **both** secrets, `CODER_API_KEY` and
`KC_TUNNEL_TOKEN`. Before you run the cell with the script, run these lines in a cell above it:

```python
import os
os.environ["KC_MODE"] = "named"
os.environ["KC_TUNNEL_HOST"] = "your-helper-hostname"  # hostname only, no https://
os.environ["KC_CTX"] = "32768"      # context window in tokens (default is 16384)   [test this first]
os.environ["KC_MAX_OUT"] = "4096"   # longest single reply (default is 1024)
```

Why: Cline sends a long built-in prompt plus its tool list on every message, and the server stops
with an error (it does not silently cut) when a request is too big. A bigger window uses more GPU
memory. If the model fails to load, remove `KC_CTX`, or set `PROFILE = "A-small"`, and note it.
The notebook prints `context window: ...` so you can see what was used.

## 2. Does the tunnel stream? (the question that decides everything)

On Ubuntu: `CODER_HOST=<hostname> bash kaggle-coder/tests/smoke.sh https://<hostname>` (key from
`CODER_KEY` or the hidden prompt). Find the line that starts `INFO  stream:true:`. Cloudflare's
docs say a tunnel passes a stream through when the server marks it `text/event-stream`
(https://developers.cloudflare.com/tunnel/troubleshooting/); this step shows whether it does here.

| It says | Meaning | Next |
|---|---|---|
| `STREAMING WORKS` | Cline should be able to stream through your tunnel | go to step 3 |
| `BUFFERED` | Cline streams by default and has **no setting to turn streaming off** (its request for one was closed "not planned") | stop; check the tunnel's route, or stay with Aider |
| `no data lines` or `UNCLEAR` | error, hang or a reply too short to judge | run it again once; if the same, treat as BUFFERED |

Also record: do all the `PASS` lines pass? Was the large-prompt time under 100 s?

## 3. Install VS Code and Cline (your laptop)

1. Install VS Code (https://code.visualstudio.com/). Open it. In **Settings**, search
   `telemetry.telemetryLevel` and set it to `off`.
2. Extensions (`Ctrl+Shift+X`): install **Cline**, publisher **saoudrizwan** (id
   `saoudrizwan.claude-dev`). Check the publisher before installing.
3. Open your throwaway folder (File, Open Folder). When VS Code asks, trust **only this folder**.
4. After the basic tasks work, try `../cline/settings.json` as your user settings (back up yours
   first; it blocks every other extension) and copy `../cline/rules.md` to
   `Documents\Cline\Rules\signal-below.md` (global rules, so nothing goes in the game folder).
   Check: Copilot is gone, Cline still answers, another extension is refused, and the Git diff
   view still works.

## 4. Point Cline at the server

Click the Cline icon, then the gear icon. Per Cline's docs (https://docs.cline.bot/provider-config/openai-compatible):

| Field | Value |
|---|---|
| API Provider | **OpenAI Compatible** |
| Base URL | `https://<hostname>/v1` (the `/v1` part: [test this first]) |
| API Key | the key you made in step 1 |
| Model ID | `kaggle-coder` |
| Model Configuration: Context Window size | `32768` (match `KC_CTX`) |
| Model Configuration: Max Output Tokens | `4096` (match `KC_MAX_OUT`) |

Click **Verify** if the button is there. Prices can stay empty or zero.

## 5. Lock it down before the first task

- **Auto-approve: everything OFF.** If you want one convenience, the docs recommend only "Read
  project files". **YOLO mode stays off.** [test this first: find where the toggles are in your version]
- **Telemetry:** gear icon, General, untick "Allow error and usage reporting". Cline still contacts
  its servers for sign-in and feature flags, and some issues report telemetry continuing; watch
  step 7.
- Start in **Plan** mode (it plans, you approve, then switch to Act).
- No MCP servers. No `.clinerules` file in the throwaway folder.
- Ignore any "sign in to Cline" prompts; you do not need an account.

## 6. Three small tasks

Make `hello.py` containing `print("hello")` yourself, then ask Cline:

1. "Explain hello.py." (reads a file; should not need a write)
2. "Add a comment to hello.py saying what it does." Watch for the **diff/approve prompt**. Say no
   once, check nothing changed, then try again and approve.
3. "Run hello.py." It should **ask before running a command**. Say no. Then approve once and read
   the result.

Write down for each: did it **ask before writing**? **ask before running**? Did the tool call work
at all, or did Cline say the model gave an invalid response / a tool-format error? How many seconds
until the first text, and until done? Did the server complain about the context size?

## 7. Look for surprises (5 minutes)

- Open **Resource Monitor** (Windows), Network tab, and note which hosts VS Code and Cline talk to
  while you work, besides your tunnel address.
- Look at the Kaggle notebook output: only the address and the status lines should show. **The key
  must not appear anywhere.**
- Does the folder now contain files you did not create (`.cline*`, `.vscode`)? Look inside.

## 8. Clean up

- Stop the Kaggle session (stop button). [test this first: where it is]
- Delete the key from Cline's settings, then rotate the Kaggle Secret `CODER_API_KEY`.
- Check the old hostname no longer answers from the model. Keep `KC_TUNNEL_TOKEN` unticked on
  notebooks that do not need it.
- Delete the throwaway folder.

## 9. Write the result here (or tell me), then we decide

| Check | Result |
|---|---|
| Streaming through the named tunnel (step 2) | |
| Base URL needed `/v1`? | |
| Context window used / did it fit in GPU memory? | |
| Tool calls worked? | |
| Asked before writing? Before running a command? | |
| Seconds to first text / to finish | |
| Unexpected network hosts or files | |
| Cline verdict for the teens: yes / yes with limits / no | |

## What we already know about Cline (from research, not from a test)

- Licence Apache-2.0, very active (releases daily), 7.5M+ Open VSX downloads.
- **No setting to turn streaming off** (https://github.com/cline/cline/issues/3728, closed "not planned").
- Telemetry on by default; it also keeps contacting Cline servers for sign-in and flags.
- It reads `.clinerules` from a project folder, so a hostile repo can steer it: never open an
  unreviewed folder in Cline. Whether a repo can loosen its permissions is untested.
- Past security reports exist (a dashboard WebSocket bug, safety-check bypasses reported by
  Manifold, a CI supply-chain attack on the project). Keep it updated and review its release notes.
- It is an agent: with auto-approve on, it writes files and runs commands on **your** laptop. The
  teens' setup must keep auto-approve off, and Corey must check that after every update.

Passing every check here means "no indicators found by these checks". It does not show that the
model's code is harmless, that the tunnel is private, or that a teen will not click Approve on
something they have not read.

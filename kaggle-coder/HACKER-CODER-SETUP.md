# Top 5 Hacker & Coder Setups

> Build games, websites, apps and automation. Learn to code with your own AI coding assistant running on a shared GPU server.

## 1. Pick your setup

| Rank | Setup | Best for | Difficulty |
|---|---|---|---|
| 1 | Zed + Ollama | Clean, integrated AI coding | Easy |
| 2 | VS Code + Continue | Learning programming and debugging | Easy |
| 3 | VS Code + Cline | Building projects with an AI agent | Easy |
| 4 | VS Code + Kilo Code | More advanced agent workflows | Medium |
| 5 | VSCodium + Kilo Code | Open-source development environment | Medium |

Pick **one** setup. You do not need all five. The rankings are recommendations, not measured benchmarks.

## 2. Install the basics

- [Git](https://git-scm.com/downloads) — save versions of your code.
- [Python](https://www.python.org/downloads/) — scripts, games and automation.
- [Node.js LTS](https://nodejs.org/) — websites and JavaScript projects.
- One IDE from the list below.

On Windows, open a new terminal and check:

```powershell
 git --version
 python --version
 node --version
 npm --version
```

You do not need to install Ollama or own a GPU on your laptop when using the shared server.

## 3. Connect to your AI server

Ask your server administrator for these details:

| Setting | Example (replace with actual values) |
|---|---|
| Provider | Ollama |
| Server URL | `http://gpu-server:11434` |
| Model | `qwen3-coder:30b` |
| Access | Private network or approved VPN |

The sample hostname is not a real endpoint. Use the administrator's supplied address and exact installed model name. From PowerShell, check a directly accessible Ollama endpoint:

```powershell
Invoke-RestMethod http://gpu-server:11434/api/tags
```

If it fails, check your network access with the administrator. Never expose an unauthenticated Ollama port to the internet. For remote access, use an approved private VPN or authenticated HTTPS gateway.

## 4. Install your chosen IDE

### #1 — Zed + Ollama

**Best for:** a simple, fast editor with a built-in agent.

1. Download [Zed](https://zed.dev/download).
2. Open a project folder.
3. Open the Agent panel and its settings; locate LLM providers and Ollama.
4. Set the API URL to the shared server address.
5. Select the installed model in the agent model picker.
6. Ask the agent to explain a file. Review changes before accepting them.

[Official Ollama setup](https://zed.dev/docs/ai/use-a-local-model) · [AI quick start](https://zed.dev/docs/ai/quick-start)

### #2 — VS Code + Continue

**Best for:** learning with a mature debugger, extensions and AI assistance.

1. Download [VS Code](https://code.visualstudio.com/).
2. Open Extensions (`Ctrl+Shift+X`) and install Continue.
3. Open Continue and its local configuration (`config.yaml`).
4. Add the following model configuration, replacing the server and model as needed:

```yaml
name: Coding Club
version: 1.0.0
schema: v1
models:
  - name: Club Coder
    provider: ollama
    model: qwen3-coder:30b
    apiBase: http://gpu-server:11434
    roles:
      - chat
      - edit
      - apply
    capabilities:
      - tool_use
```

5. Select Club Coder. Start with Chat before trying Agent mode. The model must actually support reliable tool calling.

[Official Ollama setup](https://docs.continue.dev/guides/ollama-guide)

### #3 — VS Code + Cline

**Best for:** AI-assisted project building with explicit approvals.

1. Install VS Code and the [Cline extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev).
2. Open the Cline panel and API configuration.
3. Choose Ollama and enable the custom base URL option.
4. Enter the shared server address and select the installed model.
5. Keep automatic approvals disabled. Review file edits and terminal commands.

[Official Ollama integration](https://github.com/ollama/ollama/blob/main/docs/integrations/cline.mdx)

### #4 — VS Code + Kilo Code

**Best for:** larger projects and more advanced agent workflows.

1. Install VS Code and the Kilo Code extension.
2. Open Kilo settings and the Providers tab.
3. Add Ollama and configure its base URL for the shared GPU server.
4. Choose the model (for example `ollama/qwen3-coder:30b`).
5. Review agent permissions and leave automatic command execution off initially.

[Official installation](https://kilo.ai/docs/getting-started/installing) · [Ollama setup](https://kilo.ai/docs/ai-providers/ollama)

### #5 — VSCodium + Kilo Code

**Best for:** students interested in open-source tools and customization.

1. Download [VSCodium](https://vscodium.com/).
2. Search for Kilo Code in the Open VSX extension registry.
3. Install it and follow the same Ollama provider configuration as setup #4.
4. Open your project and test the AI connection.

[Open VSX registry](https://open-vsx.org/) · [Kilo installation](https://kilo.ai/docs/getting-started/installing)

VSCodium uses a different extension marketplace; not every VS Code extension is available.

## 5. Your first 15-minute project

Create a folder called `coding-club`, open it in the IDE and create `hello.py`:

```python
name = input("What is your hacker name? ")
print(f"Welcome to the coding club, {name}!")
```

Run it from the integrated terminal:

```powershell
python hello.py
```

Now ask the AI: **Explain this program line by line. Then give me a challenge to improve it without writing the solution for me.**

Save your work with Git:

```bash
 git init
 git add hello.py
 git commit -m "My first coding project"
```

Git may ask you to configure a name and email first. Use an approved identity.

## 6. Level up

| Level | Project | Skills |
|---|---|---|
| 1 | Number guessing game | Variables, loops, conditions |
| 2 | Personal website | HTML, CSS, JavaScript |
| 3 | Python adventure game | Functions, files, testing |
| 4 | Roblox game | Luau, game logic, Roblox Studio |
| 5 | Local cybersecurity challenge | Linux, networking, secure coding |

For Roblox, use the IDE for source editing and Roblox Studio for building and testing the game. Rojo is an optional integration when you are ready.

## 7. Your AI agent is your teammate, not your replacement

| Mode | Example prompt |
|---|---|
| Learn | Explain the concept and give me a hint. Don't solve it. |
| Plan | Break my idea into small tasks. Don't edit files yet. |
| Build | Help me implement one feature. Explain each change. |
| Debug | Help me find the bug. Show me how to reproduce it. |
| Review | Review my code, suggest improvements and write tests. |

Always understand what you run. Review changes, test your code and commit working versions. Never paste passwords, tokens or private information into AI chats. Only conduct security experiments on systems you own or have explicit permission to test, such as local labs or [picoCTF](https://picoctf.org/).

## 8. Shared GPU server — administrator only

```text
Student laptops (IDE + agent)
          |
   Private network / VPN
          |
 Shared GPU server (Ollama)
```

Provide each student a separate project directory and non-admin account. For remote students, use restricted VPN access or an authenticated gateway with individual credentials, usage limits and revocation. The GPU server runs inference; the IDE agent may execute commands on the student's computer or remote development host, depending on configuration. Isolate development workspaces and do not grant agents access to the GPU host shell. Test concurrent sessions and tool calling before onboarding the group. Disable optional cloud features where practical if keeping code private is a requirement; review telemetry settings separately.

## Notes

- The five setups were selected for beginner usability, remote model connectivity and integrated development, not benchmarked head-to-head.
- Roo Code was excluded because its original extension was discontinued in May 2026: https://github.com/RooCodeInc/Roo-Code-Docs/blob/main/docs/sunset.md
- Documentation checked November 26, 2026. The actual shared server address, installed model, access policy and end-to-end compatibility still require administrator confirmation.

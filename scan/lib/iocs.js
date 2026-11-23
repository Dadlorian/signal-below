'use strict';
// Shared detection rules. Each rule: { id, level, where, re, desc, exts? }
//   level: FAIL = very likely malicious / never legitimate in this project
//          WARN = needs a human look
//          INFO = inventory only
//   where: 'both' | 'code' (repo source) | 'pkg' (installed packages)
// Some rules have a different level in code vs pkg (pkgLevel / codeLevel).
// NOTE: this file contains the strings it searches for, so scan/ is allowlisted in code checks.

const CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts', '.html', '.htm', '.vue', '.svelte', '.sh', '.bash', '.zsh', '.json', '.yml', '.yaml', '.toml', '.py', '.rb', '.ps1', '.bat', '.cmd']);
const SCRIPT_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts', '.html', '.htm', '.vue', '.svelte', '.sh', '.bash', '.zsh', '.py', '.ps1', '.bat', '.cmd']);

// Rule ids are stable so they can be referenced in allowlist entries as "pkg:RULE".
const RULES = [
  // ---- FAIL: remote code execution / exfiltration primitives -----------------------------------
  { id: 'PIPE_TO_SHELL', level: 'FAIL', where: 'both',
    re: /\b(curl|wget)\b[^|\n;]{0,220}\|\s*(sudo\s+)?(ba|z|da|k)?sh\b/,
    desc: 'downloads a script and pipes it to a shell' },
  { id: 'EVAL_DECODE', level: 'FAIL', where: 'both',
    re: /\beval\s*\(\s*(atob|Buffer\.from|unescape|decodeURIComponent|String\.fromCharCode)\s*\(/,
    desc: 'eval of decoded/obfuscated content' },
  { id: 'FUNCTION_DECODE', level: 'FAIL', where: 'both',
    re: /\bFunction\s*\(\s*(atob|Buffer\.from|unescape|decodeURIComponent)\s*\(/,
    desc: 'Function constructor over decoded content' },
  { id: 'BASE64_EXEC', level: 'FAIL', where: 'both',
    // "x.exec(" is excluded (RegExp.exec is everywhere); child_process.exec / cp.exec are matched explicitly.
    re: /(base64[^\n]{0,120}((?<![\w.$])(exec|execSync|spawn|spawnSync|execFile|execFileSync|eval|Function)\s*\(|\b(child_process|childProcess|cp)\.(exec|execSync|spawn|spawnSync|execFile)\s*\())|(((?<![\w.$])(exec|execSync|spawn|spawnSync|execFile)|\b(child_process|childProcess|cp)\.(exec|execSync|spawn|spawnSync|execFile))\s*\([^\n]{0,120}base64)/,
    desc: 'base64 payload handed to exec/eval', window: 4 },
  { id: 'REMOTE_IMPORT', level: 'FAIL', where: 'both',
    re: /\bimport\s*\(\s*[`'"]https?:\/\//,
    desc: 'dynamic import of code from a remote URL' },
  { id: 'NPMRC_READ', level: 'FAIL', where: 'both',
    re: /\.npmrc\b[^\n]{0,80}(read|open|exists|home|token)|\b(read|open|exists|home|token)[^\n]{0,80}\.npmrc\b/i,
    desc: 'touches the npm credentials file (~/.npmrc)' , scriptOnly: true },
  { id: 'CREDENTIAL_PATHS', level: 'FAIL', where: 'both',
    re: /\.ssh\/|\bid_rsa\b|\bid_ed25519\b|\.aws\/credentials|\.gnupg\b|\.docker\/config\.json|\.kube\/config|\.config\/gcloud|\.git-credentials|\.netrc\b/,
    desc: 'references SSH/cloud/git credential files', scriptOnly: true },
  { id: 'EXFIL_HOST', level: 'FAIL', where: 'both',
    re: /webhook\.site|pastebin\.com|ngrok(-free)?\.(io|app|dev)|discord(app)?\.com\/api\/webhooks|hooks\.slack\.com\/services|\btransfer\.sh\b|requestbin\.|pipedream\.net|burpcollaborator|oastify\.com|\binteract\.sh\b|api\.telegram\.org\/bot|\b0x0\.st\b|\bfile\.io\b|anonfiles\.|mega\.nz\/|\bdpaste\.(com|org)|hastebin\.|paste\.ee|ipinfo\.io|api\.ipify\.org|checkip\.amazonaws/i,
    desc: 'known exfiltration / staging service' },
  { id: 'ENV_DUMP', level: 'FAIL', where: 'both',
    re: /JSON\.stringify\s*\(\s*process\.env\s*\)|Object\.(entries|keys)\s*\(\s*process\.env\s*\)[^\n]{0,80}(fetch|http|post|send)/,
    desc: 'serialises the whole environment (secrets) for sending' },
  { id: 'SHELL_RC_WRITE', level: 'FAIL', where: 'both',
    re: /(\.bashrc|\.zshrc|\.bash_profile|\.profile)\b[^\n]{0,80}(append|write|>>|echo)|(append|write|>>|echo)[^\n]{0,80}(\.bashrc|\.zshrc|\.bash_profile)\b/,
    desc: 'writes to a shell start-up file (persistence)', scriptOnly: true },
  { id: 'SHAI_HULUD', level: 'FAIL', where: 'both',
    re: /shai[-_]?hulud|trufflehog|bun_environment|setup_bun\.js|processor\.sh|truffleSecrets\.json|actionsSecrets\.json|\bcloud\.json\b.*\bcontents\.json\b/i,
    desc: 'marker string of the Shai-Hulud npm worm family' },
  { id: 'CI_TOKEN_READ', level: 'FAIL', where: 'pkg', codeLevel: 'WARN',
    re: /process\.env\.(NPM_TOKEN|NODE_AUTH_TOKEN|NPM_CONFIG__AUTH(TOKEN)?|GITHUB_TOKEN|GH_TOKEN|AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID|AWS_SESSION_TOKEN|GOOGLE_APPLICATION_CREDENTIALS|AZURE_CLIENT_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY)\b/,
    desc: 'reads a publishing/cloud credential from the environment' },
  { id: 'RAW_IP_URL', level: 'FAIL', where: 'pkg', codeLevel: 'WARN',
    re: /https?:\/\/(?!(127\.|10\.|0\.0\.0\.0|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|1\.1\.1\.1|8\.8\.8\.8))\d{1,3}(\.\d{1,3}){3}\b/,
    desc: 'URL that points at a bare public IP address instead of a hostname' },

  // ---- WARN: dangerous but sometimes legitimate --------------------------------------------------
  { id: 'EVAL', level: 'WARN', where: 'both', re: /(^|[^.\w])eval\s*\(/, desc: 'eval()' , scriptOnly: true },
  { id: 'NEW_FUNCTION', level: 'WARN', where: 'both', re: /\bnew\s+Function\s*\(/, desc: 'Function constructor (runtime code generation)', scriptOnly: true },
  { id: 'CHILD_PROCESS', level: 'WARN', where: 'both',
    re: /require\s*\(\s*['"](node:)?child_process['"]\s*\)|from\s+['"](node:)?child_process['"]|\b(execSync|spawnSync|execFileSync)\s*\(|process\.binding\s*\(\s*['"]spawn/,
    desc: 'spawns other programs (child_process)', scriptOnly: true },
  { id: 'HOMEDIR_READ', level: 'WARN', where: 'both',
    re: /os\.homedir\s*\(\s*\)[^\n]{0,80}(readFile|readdir|existsSync|createReadStream|statSync)|(readFile|readdir|createReadStream)[^\n]{0,80}os\.homedir\s*\(/,
    desc: 'reads files from the user home directory', scriptOnly: true },
  { id: 'HEX_ESCAPE_BLOB', level: 'WARN', where: 'both',
    re: /(\\x[0-9a-fA-F]{2}){24,}/,
    desc: 'long hex-escaped string (obfuscation)', scriptOnly: true },
  { id: 'CHARCODE_BLOB', level: 'WARN', where: 'both',
    re: /String\.fromCharCode\s*\(\s*(\d{1,3}\s*,\s*){12,}/,
    desc: 'long fromCharCode sequence (obfuscation)', scriptOnly: true },
  { id: 'ATOB', level: 'WARN', where: 'code', re: /\batob\s*\(/, desc: 'base64 decode in browser code', scriptOnly: true },
  { id: 'DOCUMENT_WRITE', level: 'WARN', where: 'code', re: /document\.write(ln)?\s*\(/, desc: 'document.write', scriptOnly: true },
  { id: 'DOCUMENT_COOKIE', level: 'WARN', where: 'code', re: /document\.cookie/, desc: 'reads or writes cookies', scriptOnly: true },
  { id: 'POSTMESSAGE_STAR', level: 'WARN', where: 'code', re: /postMessage\s*\([^)]*,\s*['"]\*['"]/, desc: 'postMessage to any origin (*)', scriptOnly: true },
  { id: 'STORAGE_SECRET', level: 'WARN', where: 'code',
    re: /(localStorage|sessionStorage)\.(setItem|getItem)\s*\(\s*[`'"][^`'"]*(token|secret|password|passwd|apikey|api_key|auth|credential|private)[^`'"]*[`'"]/i,
    desc: 'browser storage of something that looks secret', scriptOnly: true },
  { id: 'SERVICE_WORKER', level: 'WARN', where: 'code', re: /serviceWorker\.register\s*\(/, desc: 'registers a service worker (persists in browser)', scriptOnly: true },
  { id: 'EXTERNAL_SCRIPT_NO_SRI', level: 'WARN', where: 'code',
    re: /<(script|iframe)\b[^>]*\bsrc\s*=\s*["']https?:\/\/[^"']+["'](?![^>]*\bintegrity=)[^>]*>/i,
    desc: 'external <script>/<iframe> without Subresource Integrity', exts: ['.html', '.htm'] },
  { id: 'EXTERNAL_STYLE_NO_SRI', level: 'INFO', where: 'code',
    re: /<link\b[^>]*\bhref\s*=\s*["']https?:\/\/[^"']+["'](?![^>]*\bintegrity=)[^>]*>/i,
    desc: 'external stylesheet/preconnect <link> without SRI', exts: ['.html', '.htm'] },
  // vite.config.* files get a structural analysis in code-scan.js (allowedHosts, host, fs.strict, fs.deny, fs.allow, proxy).
  // This regex only covers the CLI side: "vite --host" in package.json scripts / .replit.
  { id: 'VITE_EXPOSED', level: 'WARN', where: 'code',
    re: /\bvite\b[^\n"']*\s--host\b/,
    desc: 'dev/preview server started with --host: listens on every network interface (LAN, or the internet through a tunnel)', hygiene: true, files: /(^|\/)package\.json$|\.replit$/ },
  { id: 'OPEN_CORS', level: 'WARN', where: 'code',
    re: /\bcors\s*\(\s*\)|origin\s*:\s*(['"]\*['"]|true)\b|Access-Control-Allow-Origin['"]?\s*[,:]\s*['"]\*['"]/,
    desc: 'CORS open to any origin', hygiene: true, scriptOnly: true },
  { id: 'TARGET_BLANK', level: 'INFO', where: 'code',
    re: /target\s*=\s*["']_blank["'](?![^>]*rel\s*=\s*["'][^"']*noopener)/i,
    desc: 'target=_blank without rel=noopener (modern browsers imply noopener; low impact)', exts: ['.html', '.htm', '.tsx', '.jsx'] },

  // ---- INFO: network / DOM inventory -------------------------------------------------------------
  { id: 'NET_CALL', level: 'INFO', where: 'code',
    re: /\bfetch\s*\(|XMLHttpRequest|new\s+WebSocket\s*\(|sendBeacon\s*\(|new\s+EventSource\s*\(|importScripts\s*\(/,
    desc: 'network call (fetch/XHR/WebSocket/beacon/EventSource/importScripts)', scriptOnly: true },
  { id: 'WINDOW_OPEN', level: 'INFO', where: 'code', re: /window\.open\s*\(/, desc: 'window.open', scriptOnly: true },
];

// innerHTML / dangerouslySetInnerHTML are handled separately (need constant-vs-dynamic triage).
const INNER_HTML_RE = /\.innerHTML\s*=\s*(.+)$/;
const OUTER_HTML_RE = /\.outerHTML\s*=\s*(.+)$/;
const INSERT_ADJ_RE = /insertAdjacentHTML\s*\(\s*[^,]+,\s*(.+)$/;
const DANGEROUS_RE = /dangerouslySetInnerHTML/;
// A constant RHS: string literal with no interpolation or concatenation.
function isConstantRhs(rhs) {
  const s = rhs.replace(/[;,]\s*$/, '').trim();
  if (/^''$|^""$|^``$/.test(s)) return true;
  if (/^(['"])(?:(?!\1).)*\1$/.test(s)) return true;
  if (/^`[^`$]*`$/.test(s)) return true;
  return false;
}

// Lifecycle scripts npm runs automatically on install/pack.
const LIFECYCLE = ['preinstall', 'install', 'postinstall', 'prepare', 'prepack', 'postpack', 'prepublish', 'prepublishOnly', 'preprepare', 'postprepare', 'dependencies'];

// bin names that would shadow common system / toolchain commands if a package declared them.
const SYSTEM_BINS = new Set(['ls', 'cd', 'cat', 'echo', 'rm', 'cp', 'mv', 'sh', 'bash', 'zsh', 'sudo', 'su', 'node', 'nodejs', 'npm', 'npx', 'pnpm', 'yarn', 'bun', 'git', 'curl', 'wget', 'ssh', 'scp', 'python', 'python3', 'pip', 'pip3', 'docker', 'make', 'gcc', 'cc', 'ld', 'env', 'which', 'tar', 'unzip', 'zip', 'kill', 'ps', 'systemctl', 'service', 'crontab', 'login', 'passwd', 'chmod', 'chown', 'mount', 'vi', 'vim', 'nano', 'less', 'more', 'head', 'tail', 'grep', 'sed', 'awk', 'find', 'xargs', 'tsc', 'vite', 'eslint', 'prettier', 'code']);

// Names of packages that are commonly imitated. Used for lookalike (typosquat) detection.
const POPULAR = [
  'react', 'react-dom', 'react-is', 'react-router', 'react-router-dom', 'redux', 'react-redux', 'next', 'vue', 'angular', 'svelte',
  'lodash', 'lodash-es', 'underscore', 'ramda', 'moment', 'dayjs', 'date-fns', 'luxon', 'uuid', 'nanoid', 'classnames', 'clsx',
  'express', 'koa', 'fastify', 'hapi', 'cors', 'body-parser', 'cookie-parser', 'helmet', 'morgan', 'compression', 'serve-static',
  'axios', 'node-fetch', 'got', 'request', 'superagent', 'undici', 'ws', 'socket.io', 'graphql', 'apollo-server',
  'chalk', 'commander', 'yargs', 'minimist', 'inquirer', 'ora', 'debug', 'dotenv', 'cross-env', 'concurrently', 'nodemon',
  'typescript', 'ts-node', 'tsx', 'tslib', 'esbuild', 'rollup', 'webpack', 'vite', 'parcel', 'babel-core', 'babel-loader',
  'eslint', 'prettier', 'jest', 'mocha', 'chai', 'vitest', 'cypress', 'playwright', 'puppeteer', 'husky', 'lint-staged',
  'tailwindcss', 'postcss', 'autoprefixer', 'sass', 'less', 'styled-components', 'framer-motion',
  'zod', 'yup', 'joi', 'ajv', 'immer', 'zustand', 'swr', 'mobx', 'rxjs',
  'mongoose', 'mongodb', 'pg', 'mysql', 'mysql2', 'sqlite3', 'redis', 'ioredis', 'prisma', 'sequelize', 'knex', 'drizzle-orm',
  'jsonwebtoken', 'bcrypt', 'bcryptjs', 'passport', 'crypto-js', 'argon2',
  'fs-extra', 'glob', 'rimraf', 'mkdirp', 'semver', 'async', 'bluebird', 'through2', 'readable-stream',
  'colors', 'picocolors', 'kleur', 'event-stream', 'ua-parser-js', 'coa', 'rc', 'left-pad', 'is-promise', 'node-ipc',
  'electron', 'cheerio', 'jsdom', 'marked', 'highlight.js', 'prismjs', 'three', 'd3', 'chart.js', 'recharts',
  'lucide-react', 'sonner', 'cmdk', 'wouter', 'vaul', 'input-otp', 'next-themes', 'react-hook-form', 'react-day-picker',
  'aws-sdk', 'firebase', 'stripe', 'twilio', 'openai', 'langchain', 'prop-types', 'scheduler', 'loose-envify', 'source-map', 'acorn',
  // scoped
  '@babel/core', '@babel/preset-env', '@babel/runtime', '@types/node', '@types/react', '@types/react-dom', '@types/express',
  '@radix-ui/react-dialog', '@radix-ui/react-slot', '@tailwindcss/vite', '@tailwindcss/typography', '@vitejs/plugin-react',
  '@tanstack/react-query', '@hookform/resolvers', '@emotion/react', '@mui/material', '@aws-sdk/client-s3', '@anthropic-ai/sdk',
  '@esbuild/linux-x64', '@rollup/rollup-linux-x64-gnu', '@rolldown/binding-linux-x64-gnu',
];
const POPULAR_SCOPES = ['@babel', '@types', '@radix-ui', '@tailwindcss', '@vitejs', '@rollup', '@esbuild', '@tanstack', '@hookform', '@aws-sdk', '@angular', '@emotion', '@mui', '@anthropic-ai', '@rolldown', '@floating-ui', '@workspace', '@replit', '@swc', '@oxc-project', '@jridgewell'];
// Words that lure a developer into installing or that imitate security tooling.
const LURE_RE = /(^|[-_.@/])(update|updater|upgrade|security|secure|patch|fix|official|installer|install|setup|verify|verified|wallet|miner|keylog|stealer|free|crack|hack)([-_.]|$)/i;

module.exports = { RULES, CODE_EXTS, SCRIPT_EXTS, INNER_HTML_RE, OUTER_HTML_RE, INSERT_ADJ_RE, DANGEROUS_RE, isConstantRhs, LIFECYCLE, SYSTEM_BINS, POPULAR, POPULAR_SCOPES, LURE_RE };

// Link parsing for chat replies.
//
// Pure and dependency-free so it can be unit-tested without a DOM or a React
// renderer -- see scripts/test-linkify.mjs. ChatWidget maps the tokens this
// returns onto <a> elements.
//
// Deliberately not react-markdown: this needs two constructs, and a full
// markdown pipeline would be a large dependency plus an HTML-injection surface
// for model output.

// Three alternatives, in priority order:
//   1. [label](url)         -- markdown link
//   2. http(s)://...        -- explicit URL
//   3. github.com/path      -- bare domain WITH a path, or a www. host
//
// (3) exists because the model routinely writes "github.com/Surya-prakas/x"
// with no scheme -- verified against real NVIDIA NIM output -- which the first
// two patterns miss entirely, leaving the main links in Nova's answers dead.
// It requires either a www. prefix or a "/path" so that ordinary prose
// ("R² = 98.75%", "e.g. this", "Node.js") cannot be mistaken for a host.
// The TLD list is closed for the same reason: an open [a-z]{2,} would linkify
// "Node.js" and "vs.code".
const TLD = "com|dev|io|org|net|ai|app|co|in|me|gg|xyz";
const LINK_RE = new RegExp(
  [
    "\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\)",
    "(https?:\\/\\/[^\\s<]+[^\\s<.,:;!?)\\]}\"'])",
    `((?:www\\.[a-z0-9-]+|[a-z0-9-]+)\\.(?:${TLD})\\/[^\\s<]*[^\\s<.,:;!?)\\]}"']|www\\.[a-z0-9-]+\\.(?:${TLD}))`,
  ].join("|"),
  "gi"
);

/**
 * Splits text into plain-text and link tokens.
 * @param {string} text
 * @returns {Array<{type:'text',value:string}|{type:'link',label:string,href:string}>}
 */
export function parseLinks(text) {
  if (typeof text !== "string" || text === "") return [];

  const tokens = [];
  let last = 0;
  let match;

  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(text)) !== null) {
    const [full, mdLabel, mdUrl, plainUrl, bareHost] = match;

    if (match.index > last) {
      tokens.push({ type: "text", value: text.slice(last, match.index) });
    }

    const label = mdLabel || plainUrl || bareHost;
    const target = mdUrl || plainUrl || bareHost;
    // Scheme-less hosts need one added or the browser resolves them relative
    // to the current page (/github.com/...). Only ever https, so there is no
    // javascript:/data: URL to guard against.
    const href = /^https?:\/\//i.test(target) ? target : `https://${target}`;

    tokens.push({ type: "link", label, href });
    last = match.index + full.length;
  }

  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });
  return tokens;
}

import sanitizeHtml from "sanitize-html";

const colorVal = [
  /^#[0-9a-fA-F]{3,8}$/,
  /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
  /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
];

const blogSanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "blockquote",
    "code",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "hr",
    "span",
    "mark",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    span: ["style"],
    mark: ["style", "data-color"],
    p: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
  },
  allowedStyles: {
    span: {
      color: colorVal,
      "background-color": colorVal,
      "font-size": [/^\d+(?:\.\d+)?(px|rem|em)$/],
      "line-height": [/^\d+(?:\.\d+)?$/],
      "font-family": [/^[-_a-zA-Z0-9\s,"'.]+$/],
    },
    mark: {
      "background-color": colorVal,
      color: [/^inherit$/],
    },
    p: {
      "text-align": [/^left|right|center|justify$/],
    },
    h1: { "text-align": [/^left|right|center|justify$/] },
    h2: { "text-align": [/^left|right|center|justify$/] },
    h3: { "text-align": [/^left|right|center|justify$/] },
    h4: { "text-align": [/^left|right|center|justify$/] },
  },
  allowedSchemes: ["http", "https"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
      target: "_blank",
    }),
  },
};

export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html || "", blogSanitizeOptions);
}

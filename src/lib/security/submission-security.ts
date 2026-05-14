import { createHash } from "crypto";
import sanitizeHtml from "sanitize-html";

const INJECTION_MARKERS = [
  "<script",
  "javascript:",
  "onerror=",
  "onclick=",
  "onload=",
  "<iframe",
  "data:text/html",
  "vbscript:",
  "expression(",
  "document.cookie",
  "document.write",
];

const IDEMPOTENCY_KEY_RE = /^[a-zA-Z0-9:_-]{8,128}$/;

function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function sanitizeSubmissionText(
  value: string,
  maxLen = 5000
): string {
  const normalized = stripControlChars(value).trim();
  const htmlStripped = sanitizeHtml(normalized, {
    allowedTags: [],
    allowedAttributes: {},
  });
  const compact = htmlStripped.replace(/\s+/g, " ").trim();
  return compact.slice(0, maxLen);
}

function hasSuspiciousText(value: string): boolean {
  const lower = value.toLowerCase();
  return INJECTION_MARKERS.some((m) => lower.includes(m));
}

type UnknownRecord = Record<string, unknown>;

export function sanitizeEthicLineFormData<T extends UnknownRecord>(
  formData: T
): T {
  const cloned = structuredClone(formData) as UnknownRecord;

  if (typeof cloned.irregularityType === "string") {
    cloned.irregularityType = sanitizeSubmissionText(cloned.irregularityType, 120);
  }

  const sanitizeSection = (section: unknown, maxLen = 300) => {
    if (!section || typeof section !== "object") return;
    for (const [key, raw] of Object.entries(section as UnknownRecord)) {
      if (typeof raw === "string") {
        (section as UnknownRecord)[key] = sanitizeSubmissionText(raw, maxLen);
      }
    }
  };

  sanitizeSection(cloned.reporter, 250);
  sanitizeSection(cloned.reported, 250);

  if (cloned.questionnaire && typeof cloned.questionnaire === "object") {
    for (const [key, raw] of Object.entries(cloned.questionnaire as UnknownRecord)) {
      if (typeof raw === "string") {
        (cloned.questionnaire as UnknownRecord)[key] = sanitizeSubmissionText(raw, 5000);
      }
    }
  }

  return cloned as T;
}

export function normalizeIdempotencyKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  if (!key) return null;
  if (!IDEMPOTENCY_KEY_RE.test(key)) return null;
  return key;
}

export interface FileScanResult {
  safe: boolean;
  reason?: string;
  sha256: string;
}

function matchesMagic(mimeType: string, buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 4).toString() === "%PDF";
  }
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/gif") {
    const sig = buffer.subarray(0, 6).toString("ascii");
    return sig === "GIF87a" || sig === "GIF89a";
  }
  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    // DOCX/XLSX are ZIP containers
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  }
  if (mimeType === "audio/wav") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WAVE"
    );
  }
  return true;
}

async function runExternalScan(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  sha256: string
): Promise<FileScanResult | null> {
  const endpoint = process.env.FILE_SCAN_API_URL;
  if (!endpoint) return null;

  const apiKey = process.env.FILE_SCAN_API_KEY;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      filename,
      mimeType,
      sha256,
      contentBase64: buffer.toString("base64"),
    }),
  });

  if (!response.ok) {
    return {
      safe: false,
      reason: "External AV scan failed",
      sha256,
    };
  }

  const result = (await response.json()) as {
    safe?: boolean;
    reason?: string;
  };

  return {
    safe: Boolean(result.safe),
    reason: result.reason,
    sha256,
  };
}

export async function scanUploadedFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<FileScanResult> {
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  // Block common executable signatures
  const startsWithMZ = buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a;
  const startsWithELF =
    buffer.length >= 4 &&
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46;
  const startsWithMachO =
    buffer.length >= 4 &&
    ((buffer[0] === 0xfe && buffer[1] === 0xed && buffer[2] === 0xfa && buffer[3] === 0xce) ||
      (buffer[0] === 0xcf && buffer[1] === 0xfa && buffer[2] === 0xed && buffer[3] === 0xfe));

  if (startsWithMZ || startsWithELF || startsWithMachO) {
    return {
      safe: false,
      reason: "Executable signatures are not allowed",
      sha256,
    };
  }

  if (!matchesMagic(mimeType, buffer)) {
    return {
      safe: false,
      reason: "MIME type does not match file signature",
      sha256,
    };
  }

  if (mimeType === "text/plain") {
    const textSample = buffer.subarray(0, 4096).toString("utf8");
    if (hasSuspiciousText(textSample)) {
      return {
        safe: false,
        reason: "Suspicious script-like content in text file",
        sha256,
      };
    }
  }

  const external = await runExternalScan(buffer, filename, mimeType, sha256);
  if (external) return external;

  return { safe: true, sha256 };
}

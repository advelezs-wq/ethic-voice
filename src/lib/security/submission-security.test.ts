import { describe, expect, it } from "bun:test";
import {
  normalizeIdempotencyKey,
  sanitizeEthicLineFormData,
  sanitizeSubmissionText,
  scanUploadedFile,
} from "./submission-security";

describe("submission-security", () => {
  it("sanitizeSubmissionText removes active html/script content", () => {
    const raw = "   <script>alert(1)</script> hola  mundo   ";
    const sanitized = sanitizeSubmissionText(raw, 200);
    expect(sanitized).toBe("hola mundo");
  });

  it("normalizeIdempotencyKey accepts valid keys and rejects invalid ones", () => {
    expect(normalizeIdempotencyKey("idem_key-123456")).toBe("idem_key-123456");
    expect(normalizeIdempotencyKey("***")).toBeNull();
    expect(normalizeIdempotencyKey("")).toBeNull();
  });

  it("sanitizeEthicLineFormData normalizes nested string fields", () => {
    const input = {
      irregularityType: "  <b>fraude</b> ",
      reporter: { firstName: "  Ana  ", lastName: " <i>Lopez</i> " },
      reported: { firstName: " <script>x</script>Mario " },
      questionnaire: {
        freeReport: "  texto   con   espacios  ",
      },
    };
    const out = sanitizeEthicLineFormData(input);
    expect(out.irregularityType).toBe("fraude");
    expect(out.reporter.firstName).toBe("Ana");
    expect(out.reported.firstName).toBe("Mario");
    expect(out.questionnaire.freeReport).toBe("texto con espacios");
  });

  it("scanUploadedFile blocks executable signatures", async () => {
    const buffer = Buffer.from("4d5a900003000000", "hex"); // MZ header
    const result = await scanUploadedFile(buffer, "evil.txt", "text/plain");
    expect(result.safe).toBeFalse();
    expect(result.reason).toContain("Executable");
  });

  it("scanUploadedFile blocks suspicious script-like text files", async () => {
    const buffer = Buffer.from("<script>alert(1)</script>", "utf8");
    const result = await scanUploadedFile(buffer, "payload.txt", "text/plain");
    expect(result.safe).toBeFalse();
    expect(result.reason).toContain("Suspicious");
  });

  it("scanUploadedFile validates PNG signature", async () => {
    const fakePng = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
    const result = await scanUploadedFile(fakePng, "image.png", "image/png");
    expect(result.safe).toBeTrue();
  });
});

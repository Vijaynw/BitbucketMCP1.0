import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  loadConfig,
  basicAuthHeader,
  bearerAuthHeader,
  getAuthHeader,
} from "../src/config.js";

const prevEnv = { ...process.env } as Record<string, string | undefined>;

describe("config", () => {
  beforeEach(() => {
    process.env = { ...prevEnv };
    delete process.env.ATLASSIAN_USER_EMAIL;
    delete process.env.ATLASSIAN_API_TOKEN;
    delete process.env.ATLASSIAN_SITE_NAME;
    delete process.env.ATLASSIAN_SITE_URL;
  });

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it("loads from env", () => {
    process.env.ATLASSIAN_USER_EMAIL = "user@example.com";
    process.env.ATLASSIAN_API_TOKEN = "apitoken";
    process.env.BITBUCKET_DEFAULT_DEST_BRANCH = "develop";
    process.env.ATLASSIAN_SITE_URL = "bitbucket";

    const cfg = loadConfig();
    expect(cfg.ATLASSIAN_USER_EMAIL).toBe("user@example.com");
    expect(cfg.ATLASSIAN_API_TOKEN).toBe("apitoken");
    expect(cfg.baseUrl).toBe("https://api.bitbucket.org/2.0");
    expect(cfg.defaultDestinationBranch).toBe("develop");
  });

  it("loads from config file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-"));
    const file = path.join(dir, "mcp.config.json");
    fs.writeFileSync(
      file,
      JSON.stringify({
        bitbucket: {
          environments: {
            ATLASSIAN_SITE_URL: "bitbucket",
            ATLASSIAN_USER_EMAIL: "user@example.com",
            ATLASSIAN_API_TOKEN: "apitoken",
            BITBUCKET_DEFAULT_DEST_BRANCH: "release",
          },
          defaultDestinationBranch: "main",
        },
      })
    );

    const cfg = loadConfig(dir);
    expect(cfg.ATLASSIAN_USER_EMAIL).toBe("user@example.com");
    expect(cfg.ATLASSIAN_API_TOKEN).toBe("apitoken");
    expect(cfg.baseUrl).toBe("https://api.bitbucket.org/2.0");
    expect(cfg.defaultDestinationBranch).toBe("release");
  });

  it("falls back to bearer auth for non-cloud baseUrl", () => {
    process.env.ATLASSIAN_USER_EMAIL = "user@example.com";
    process.env.ATLASSIAN_API_TOKEN = "apitoken";
    process.env.ATLASSIAN_SITE_URL = "https://bitbucket.example.com";

    const cfg = loadConfig();
    expect(cfg.authType).toBe("bearer");
  });

  it("builds basic auth header", () => {
    const h = basicAuthHeader("u", "t");
    expect(h.startsWith("Basic ")).toBe(true);
  });

  it("builds bearer auth header", () => {
    const h = bearerAuthHeader("token-123");
    expect(h).toBe("Bearer token-123");
  });

  it("returns correct auth header for bearer authType", () => {
    const h = getAuthHeader("u", "token-123", "bearer");
    expect(h).toBe("Bearer token-123");
  });
});

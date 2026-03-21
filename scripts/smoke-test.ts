import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL || "";
const PASSWORD = process.env.TEST_PASSWORD || "";
const SCREENSHOT_DIR = join(__dirname, "..", "smoke-screenshots");

mkdirSync(SCREENSHOT_DIR, { recursive: true });

interface Result {
  page: string;
  status: "pass" | "fail" | "skip";
  note: string;
  screenshot?: string;
}

const results: Result[] = [];

async function screenshot(page: any, name: string) {
  const path = join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function run() {
  console.log("\n=== SourceTrack Smoke Test ===\n");
  console.log(`Target: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  const page = await context.newPage();

  // 1. Login page loads
  console.log("\n[1/8] Login page...");
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Wait for React hydration
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    const path = await screenshot(page, "01-login");
    const hasEmailInput = await page.locator('input[type="email"]').isVisible();
    const hasPasswordInput = await page.locator('input[type="password"]').isVisible();
    results.push({
      page: "Login",
      status: hasEmailInput && hasPasswordInput ? "pass" : "fail",
      note: `Email input: ${hasEmailInput}, Password input: ${hasPasswordInput}`,
      screenshot: path,
    });
  } catch (e: any) {
    await screenshot(page, "01-login-error").catch(() => {});
    results.push({ page: "Login", status: "fail", note: e.message });
  }

  // 2. Attempt login
  console.log("[2/8] Authentication...");
  if (!EMAIL || !PASSWORD) {
    console.log("  Skipping login (no TEST_EMAIL/TEST_PASSWORD set)");
    results.push({ page: "Auth", status: "skip", note: "No credentials provided — testing public pages only" });

    // Try accessing dashboard without auth to see redirect behavior
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const currentUrl = page.url();
    const path = await screenshot(page, "02-auth-redirect");
    results.push({
      page: "Auth Redirect",
      status: currentUrl.includes("/login") ? "pass" : "fail",
      note: `Unauthenticated access redirected to: ${currentUrl}`,
      screenshot: path,
    });
  } else {
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForSelector('#email', { timeout: 15000 });
      await page.locator('#email').click();
      await page.locator('#email').pressSequentially(EMAIL, { delay: 50 });
      await page.locator('#password').click();
      await page.locator('#password').pressSequentially(PASSWORD, { delay: 50 });
      await screenshot(page, "02-filled-form");
      await page.click('button[type="submit"]');
      // Wait for response
      await page.waitForTimeout(5000);
      await screenshot(page, "02-after-submit");
      console.log(`  After submit URL: ${page.url()}`);
      const errorText = await page.locator('[class*="red"], [role="alert"]').allTextContents();
      if (errorText.length) console.log(`  Error: ${errorText}`);
      // Wait for navigation away from login
      await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 20000 });
      await page.waitForTimeout(2000); // Let the destination page settle
      const path = await screenshot(page, "02-auth-landing");
      results.push({ page: "Auth", status: "pass", note: `Logged in, landed on: ${page.url()}`, screenshot: path });

      // Handle project onboarding flow: SPLASH → GREETING → PROJECT_SELECT
      if (page.url().includes("/projects")) {
        console.log("  Navigating project selection flow...");

        // Wait for splash to auto-advance, or click through it
        try {
          // Wait for GREETING screen's CONTINUE button
          await page.waitForSelector('button:has-text("CONTINUE"), button:has-text("Continue")', { timeout: 10000 });
          await screenshot(page, "02b-greeting");
          await page.click('button:has-text("CONTINUE"), button:has-text("Continue")');
          console.log("  Clicked CONTINUE on greeting screen");
        } catch {
          console.log("  No greeting screen found, may have skipped to project select");
        }

        // Wait for project cards to appear and click the first one
        try {
          await page.waitForTimeout(2000);
          await screenshot(page, "02c-project-select");
          // Click "Default Project" button inside the project card
          await page.click('button:has-text("Default Project")', { timeout: 5000 });
          console.log("  Clicked Default Project");
          // Wait for navigation to dashboard
          await page.waitForFunction(() => !window.location.pathname.includes("/projects"), { timeout: 15000 });
          await page.waitForTimeout(3000); // Let dashboard fully load
          console.log(`  Project selected, now at: ${page.url()}`);
        } catch (e: any) {
          console.log(`  Project selection issue: ${e.message}`);
          // Try direct navigation as fallback
          await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
          await page.waitForTimeout(3000);
        }
      }

      // Helper: navigate and wait for content to render
      async function visitPage(name: string, url: string, num: string) {
        console.log(`[${num}] ${name}...`);
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          // Wait for client-side hydration + data fetching
          await page.waitForTimeout(4000);
          const path = await screenshot(page, `${num}-${name.toLowerCase().replace(/\s/g, "-")}`);
          const finalUrl = page.url();
          results.push({ page: name, status: "pass", note: `Loaded: ${finalUrl}`, screenshot: path });
        } catch (e: any) {
          await screenshot(page, `${num}-${name.toLowerCase().replace(/\s/g, "-")}-error`).catch(() => {});
          results.push({ page: name, status: "fail", note: e.message });
        }
      }

      await visitPage("Dashboard", `${BASE_URL}/dashboard`, "03");
      await visitPage("Orders", `${BASE_URL}/orders`, "04");
      await visitPage("Factories", `${BASE_URL}/factories`, "05");
      await visitPage("Analytics", `${BASE_URL}/analytics`, "06");
      await visitPage("Messages", `${BASE_URL}/messages`, "07");
      await visitPage("Settings", `${BASE_URL}/settings`, "08");
    } catch (e: any) {
      results.push({ page: "Auth", status: "fail", note: `Login failed: ${e.message}` });
    }
  }

  await browser.close();

  // Print report
  console.log("\n=== RESULTS ===\n");
  const maxPage = Math.max(...results.map((r) => r.page.length));
  for (const r of results) {
    const icon = r.status === "pass" ? "PASS" : r.status === "fail" ? "FAIL" : "SKIP";
    console.log(`  [${icon}] ${r.page.padEnd(maxPage + 2)} ${r.note}`);
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  console.log(`\n  Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
  console.log(`  Screenshots: ${SCREENSHOT_DIR}\n`);

  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error("Smoke test crashed:", e);
  process.exit(1);
});

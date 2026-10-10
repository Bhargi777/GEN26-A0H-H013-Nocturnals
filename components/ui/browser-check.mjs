// Run against a development server with Playwright and @axe-core/playwright.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.FRONTEND_URL ?? "http://127.0.0.1:3100";
const output = process.env.QA_OUTPUT ?? path.join(tmpdir(), "campusconnect-frontend-qa");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(120000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const report = { pages: [], checks: [], errors };

async function visit(route, heading) {
  await page.goto(`${base}${route}`);
  await page.getByRole("heading", { name: heading, exact: true }).waitFor();
}
async function audit(name, width) {
  await page.setViewportSize({ width, height: 900 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false, `${name} overflows at ${width}px`);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  assert.deepEqual(results.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })), [], `${name} accessibility`);
  await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true });
  report.pages.push({ name, width, accessibilityViolations: 0, pageOverflow: false });
}
async function tabTo(locator) {
  for (let attempt = 0; attempt < 70; attempt++) {
    if (await locator.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Keyboard could not reach requested control");
}
async function preview(role) {
  await visit("/ui", "UI reference");
  await page.getByLabel("Preview role", { exact: true }).selectOption(role);
  await page.getByRole("button", { name: "Use preview role", exact: true }).click();
  await page.getByText("Sample role selected. Open Dashboard to inspect it.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Dismiss notification" }).last().click();
}

try {
  for (const [route, title] of [["/sign-in", "Sign in"], ["/sign-up", "Create an account"]]) {
    await visit(route, title);
    for (const width of [375, 1280]) await audit(route.slice(1), width);
  }
  await visit("/sign-in", "Sign in");
  await tabTo(page.getByLabel("Campus email (required)"));
  await page.keyboard.type("invalid");
  await page.keyboard.press("Tab");
  await page.keyboard.type("password123");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.getByText("Enter a valid campus email address.").waitFor();
  assert.equal(await page.getByLabel("Campus email (required)").evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("student@campus.example");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.getByRole("alert").filter({ hasText: "Sign-in is not connected yet." }).waitFor();
  report.checks.push("Keyboard sign-in validation, focus recovery and adapter error");

  await visit("/ui", "UI reference");
  for (const width of [375, 1280]) await audit("ui", width);
  const table = page.getByRole("table", { name: "Sample service requests" });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  assert.equal(await table.getByRole("link", { name: "SR-000104" }).count(), 1);
  await page.getByRole("searchbox", { name: "Search", exact: true }).fill("Wi-Fi");
  await table.getByRole("link", { name: "SR-000101" }).waitFor();
  assert.equal(await table.locator("tbody tr").count(), 1);
  await page.getByRole("searchbox", { name: "Search", exact: true }).fill("no matching issue");
  await page.getByText("No items match these filters.", { exact: true }).waitFor();
  report.checks.push("Table pagination, filtering and empty state");

  const upload = page.getByLabel("Issue image", { exact: true });
  await upload.setInputFiles({ name: "invalid.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") });
  await page.getByText("Choose a JPEG, PNG, WebP or GIF image.", { exact: true }).waitFor();
  await upload.setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await page.getByText("The image is too large. Choose a smaller image.", { exact: true }).waitFor();
  await upload.setInputFiles({ name: "preview.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1kAAAAASUVORK5CYII=", "base64") });
  await page.getByRole("img", { name: "Selected image: preview.png" }).waitFor();
  await page.getByRole("button", { name: "Remove image" }).click();
  assert.equal(await page.getByRole("img", { name: "Selected image: preview.png" }).count(), 0);
  report.checks.push("Image type, size, preview and removal");

  const confirmation = page.getByRole("button", { name: "Open confirmation" });
  await tabTo(confirmation);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Confirm sample change" });
  await dialog.waitFor();
  for (let count = 0; count < 4; count++) {
    await page.keyboard.press("Tab");
    assert.equal(await dialog.evaluate((element) => element.contains(document.activeElement)), true);
  }
  await page.keyboard.press("Escape");
  assert.equal(await confirmation.evaluate((element) => element === document.activeElement), true);
  report.checks.push("Confirmation focus trap, Escape and focus restoration");

  for (const role of ["student", "faculty", "technician", "dept_admin", "office_staff", "admin"]) {
    await preview(role);
    await visit("/dashboard", "Dashboard");
    for (const width of [375, 1280]) await audit(`dashboard-${role}`, width);
    const links = await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link").allTextContents();
    assert(links.includes("Dashboard"));
    if (role === "office_staff") assert.deepEqual(links, ["Dashboard", "Office review queue"]);
    if (role === "admin") assert(links.includes("Reports"));
    if (role === "technician" || role === "dept_admin") assert(links.includes("Department queue"));
  }
  report.checks.push("All six role dashboards and navigation");

  await preview("student");
  await visit("/sign-in", "Dashboard");
  assert(page.url().endsWith("/dashboard"));
  await visit("/sign-up", "Dashboard");
  assert(page.url().endsWith("/dashboard"));
  await tabTo(page.getByRole("button", { name: "Reference", exact: true }));
  await page.keyboard.press("Enter");
  assert.equal(await page.getByRole("columnheader", { name: "Reference" }).getAttribute("aria-sort"), "ascending");
  report.checks.push("Signed-in auth redirects and keyboard dashboard sorting");

  const bell = page.locator("summary[aria-label^='Notifications']");
  await tabTo(bell);
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("details[open] li").count(), 5);
  await tabTo(page.getByRole("link", { name: "View all notifications" }));
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: "Notifications", exact: true }).waitFor();
  await tabTo(page.getByRole("button", { name: "Mark Network issue assigned as read", exact: true }));
  await page.keyboard.press("Enter");
  await page.getByText("Notification marked as read.", { exact: true }).waitFor();
  assert.equal(await bell.getAttribute("aria-label"), "Notifications, 3 unread");
  await page.reload();
  await page.getByText("3 unread. Unread notifications appear first.", { exact: true }).waitFor();
  for (const width of [375, 1280]) await audit("notifications", width);
  await tabTo(page.getByRole("button", { name: "Mark all read", exact: true }));
  await page.keyboard.press("Enter");
  await page.getByText("All notifications marked as read.", { exact: true }).waitFor();
  assert.equal(await bell.getAttribute("aria-label"), "Notifications, 0 unread");
  report.checks.push("Keyboard bell and notifications, single/all read, persistence");

  await page.setViewportSize({ width: 375, height: 812 });
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await tabTo(menu);
  await page.keyboard.press("Enter");
  const mobileDialog = page.getByRole("dialog", { name: "CampusConnect" });
  await mobileDialog.waitFor();
  await page.screenshot({ path: path.join(output, "mobile-menu-375.png") });
  await page.keyboard.press("Escape");
  assert.equal(await menu.evaluate((element) => element === document.activeElement), true);
  await tabTo(page.getByRole("button", { name: "Sign out", exact: true }));
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: "Sign in", exact: true }).waitFor();
  report.checks.push("Keyboard mobile menu and sign-out");
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }

async (page) => {
  const results = [];
  const consoleErrors = [];

  await page.goto("http://localhost:8000/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://localhost:8000/login");
  await page.getByRole("textbox", { name: "اسم المستخدم" }).fill("admin");
  await page.getByRole("textbox", { name: "كلمة المرور" }).fill("admin123");
  await page.getByRole("button", { name: "تسجيل الدخول إلى النظام" }).click();
  await page.waitForTimeout(2000);

  const routes = [
    "/",
    "/members",
    "/members/new",
    "/members/13",
    "/members/13/edit",
    "/attendance",
    "/attendance/daily",
    "/attendance/monthly",
    "/attendance/rosters",
    "/transportation",
    "/armory",
    "/inventory",
    "/organization/ranks",
    "/organization/factions",
    "/settings",
    "/settings/armory-categories",
    "/settings/inventory-categories",
    "/settings/external-units",
    "/settings/field-requirements",
    "/settings/equipment-categories",
    "/settings/roles",
    "/settings/users",
    "/audit",
    "/backups",
  ];

  for (const route of routes) {
    const pageErrors = [];
    const failedReqs = [];
    const consoleMsgs = [];

    const onPageError = (err) => pageErrors.push(String(err));
    const onConsole = (msg) => {
      if (msg.type() === "error") consoleMsgs.push(msg.text());
    };
    const onRequestFailed = (req) => failedReqs.push(`${req.method()} ${req.url()} ${req.failure()?.errorText || "failed"}`);
    const onResponse = (res) => {
      if (res.status() >= 400 && !res.url().includes("/api/auth/login")) {
        failedReqs.push(`${res.status()} ${res.url()}`);
      }
    };

    page.on("pageerror", onPageError);
    page.on("console", onConsole);
    page.on("requestfailed", onRequestFailed);
    page.on("response", onResponse);

    await page.goto("http://localhost:8000" + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    const url = page.url();

    page.off("pageerror", onPageError);
    page.off("console", onConsole);
    page.off("requestfailed", onRequestFailed);
    page.off("response", onResponse);

    results.push({
      route,
      finalUrl: url,
      pageErrors,
      consoleErrors: consoleMsgs,
      httpErrors: failedReqs,
      bodySnippet: bodyText.replace(/\n+/g, " | ").slice(0, 200),
    });
  }

  return JSON.stringify(results, null, 2);
}
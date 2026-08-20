async (page) => {
  const out = [];
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // already logged in as admin from sweep; verify
  await page.goto("http://localhost:8000/members");
  await page.waitForTimeout(1200);

  const result = {};

  // 1. Baseline row count
  const countRows = async () => {
    return page.evaluate(() => {
      const rows = document.querySelectorAll("tbody tr");
      return rows.length;
    });
  };
  result.baselineRows = await countRows();

  // 2. Arabic search
  const search = page.getByPlaceholder("بحث بالاسم الكامل، الرقم الحربي، أو الرقم الوطني...");
  if (await search.count()) {
    await search.fill("جمال");
    await page.waitForTimeout(1200);
    result.afterArabicSearch = await countRows();
    const body = await page.evaluate(() => document.body.innerText);
    result.searchHasJamal = body.includes("جمال صالح رمضان الباروني");
    result.searchNoOthers = !body.includes("عادل مفتاح");
    await search.fill("");
    await page.waitForTimeout(1200);
  } else {
    result.search = "SEARCHBOX NOT FOUND";
  }

  // 3. Faction filter
  const factionCombo = page.getByText("كل الإدارات").first();
  if (await factionCombo.count()) {
    await factionCombo.click();
    await page.waitForTimeout(600);
    const options = await page.evaluate(() => {
      const els = document.querySelectorAll('[role="option"]');
      return Array.from(els).map((e) => e.textContent.trim());
    });
    result.factionOptions = options;
    const target = options.find((o) => o.includes("فصيل الإنذار"));
    if (target) {
      await page.getByRole("option", { name: target }).click();
      await page.waitForTimeout(1200);
      result.afterFactionFilter = await countRows();
      const body = await page.evaluate(() => document.body.innerText);
      result.factionFilterShowsAlertMembers = body.includes("جمال صالح رمضان الباروني");
    }
    // reset
    await page.getByText(target, { exact: true }).first().click().catch(() => {});
    await page.evaluate(() => {
      const combos = document.querySelectorAll('[data-slot="combobox-trigger"], button');
    });
  } else {
    result.factionFilter = "COMBO NOT FOUND";
  }

  // 4. Service status filter (simple native select)
  const statusSelect = page.getByRole("combobox").filter({ has: page.locator("option") }).first();
  try {
    await statusSelect.selectOption("متقاعد");
    await page.waitForTimeout(1200);
    result.afterRetiredFilter = await countRows();
    await statusSelect.selectOption("جميع الحالات");
    await page.waitForTimeout(800);
  } catch (e) {
    result.statusFilter = "ERR " + String(e).slice(0, 120);
  }

  // 5. View toggle table/grid
  const tableBtn = page.getByRole("button", { name: "عرض جدول" });
  const gridBtn = page.getByRole("button", { name: "عرض شبكي" });
  if (await gridBtn.count()) {
    await gridBtn.click();
    await page.waitForTimeout(800);
    result.gridViewActive = (await page.locator(".grid").count()) > 0 || (await page.getByText("بطاقة فرد", { exact: false }).count()) > 0;
    await tableBtn.click();
    await page.waitForTimeout(800);
  }

  // 6. Print filtered button present
  result.printFilteredBtn = (await page.getByRole("button", { name: "طباعة الكشف المفلتر" }).count()) > 0;
  // 7. Export button
  result.exportBtn = (await page.getByRole("button", { name: /تصدير/ }).count()) > 0;

  out.push({ page: "/members", result, errors: [...errors] });
  return JSON.stringify(out, null, 2);
}

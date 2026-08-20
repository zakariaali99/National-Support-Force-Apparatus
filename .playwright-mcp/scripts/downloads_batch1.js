async (page) => {
  const out = { downloads: [] };
  page.on("download", (d) => {
    out.downloads.push({ suggested: d.suggestedFilename() });
    d.path().then((p) => out.downloads[out.downloads.length - 1].path = p).catch(() => {});
  });

  // 1. Members Excel export
  await page.goto("http://localhost:8000/members");
  await page.waitForTimeout(1500);
  const expBtn = page.getByRole("button", { name: "تصدير Excel" });
  if (await expBtn.count()) { await expBtn.click(); await page.waitForTimeout(4000); }
  out.membersExportBtn = await expBtn.count();

  // 2. Daily attendance PDF
  await page.goto("http://localhost:8000/attendance");
  await page.waitForTimeout(1500);
  const dailyBtn = page.getByRole("button", { name: /طباعة الكشف العرضي|كشف التمام/ });
  if (await dailyBtn.count()) { await dailyBtn.click(); await page.waitForTimeout(1000); }
  // download inside dialog
  const dailyDl = page.getByRole("button", { name: /تنزيل/ });
  if (await dailyDl.count()) { await dailyDl.click(); await page.waitForTimeout(5000); }
  out.dailyBtnCount = await dailyBtn.count();

  // 3. Monthly attendance PDF
  await page.goto("http://localhost:8000/attendance/monthly");
  await page.waitForTimeout(1500);
  const monthDl = page.getByRole("button", { name: /تنزيل.*PDF|تنزيل الكشف|تنزيل/ });
  if (await monthDl.count()) { await monthDl.first().click(); await page.waitForTimeout(6000); }
  out.monthlyDlCount = await monthDl.count();

  // 4. Monthly CSV export
  const monthCsv = page.getByRole("button", { name: /Excel/ });
  if (await monthCsv.count()) { await monthCsv.first().click(); await page.waitForTimeout(3000); }
  out.monthlyCsvCount = await monthCsv.count();

  // 5. Audit CSV export
  await page.goto("http://localhost:8000/audit");
  await page.waitForTimeout(1500);
  const auditBtn = page.getByRole("button", { name: /تصدير/ });
  if (await auditBtn.count()) { await auditBtn.first().click(); await page.waitForTimeout(4000); }
  out.auditBtnCount = await auditBtn.count();

  // 6. Backups: run + download
  await page.goto("http://localhost:8000/backups");
  await page.waitForTimeout(1500);
  const runBtn = page.getByRole("button", { name: /إنشاء نسخة|نسخة احتياطية جديدة|تشغيل|إنشاء/ });
  if (await runBtn.count()) {
    await runBtn.first().click();
    await page.waitForTimeout(9000);
  }
  out.runBtnCount = await runBtn.count();
  // find download buttons for backups
  const dlBtns = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.map((b) => b.textContent.trim().slice(0, 40)).filter((t) => /تحميل|تنزيل|Download|استعادة|استرجاع/.test(t));
  });
  out.backupActions = dlBtns;
  if (dlBtns.length) {
    const dl = page.getByRole("button", { name: new RegExp(dlBtns[0]) });
    await dl.first().click();
    await page.waitForTimeout(4000);
  }

  return JSON.stringify(out, null, 2);
}
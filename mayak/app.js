(() => {
  "use strict";

  const audit = window.MAYAK_AUDIT;
  const stats = document.querySelector("#stats");
  const pagesBody = document.querySelector("#pages");
  const count = document.querySelector("#result-count");
  const query = document.querySelector("#query");
  const category = document.querySelector("#category");
  const status = document.querySelector("#status");

  if (!audit || !Array.isArray(audit.pages)) {
    stats.innerHTML = '<div class="empty">Сначала запустите <code>python3 mayak/update_audit.py</code>.</div>';
    return;
  }

  const metric = (value, label) => `<article class="stat"><strong>${value}</strong><span>${label}</span></article>`;
  stats.innerHTML = [
    metric(audit.summary.urls, "URL в sitemap"),
    metric(audit.summary.blog_pages, "русских blog URL"),
    metric(audit.summary.ok_html_pages, "HTML · HTTP 200"),
    metric(audit.summary.self_canonical, "self canonical"),
    metric(audit.summary.single_h1, "страниц с одним H1"),
  ].join("");

  Object.keys(audit.summary.categories).sort().forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = `${name} · ${audit.summary.categories[name]}`;
    category.append(option);
  });

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  const render = () => {
    const needle = query.value.trim().toLowerCase();
    const selectedCategory = category.value;
    const selectedStatus = status.value;
    const filtered = audit.pages.filter((page) => {
      const matchesText = !needle || `${page.title || ""} ${page.path || ""}`.toLowerCase().includes(needle);
      const matchesCategory = !selectedCategory || page.category === selectedCategory;
      const matchesStatus = !selectedStatus
        || (selectedStatus === "error" ? Number(page.status || 0) !== 200 : String(page.status) === selectedStatus);
      return matchesText && matchesCategory && matchesStatus;
    });

    count.textContent = `${filtered.length} из ${audit.pages.length}`;
    if (!filtered.length) {
      pagesBody.innerHTML = '<tr><td class="empty" colspan="7">Ничего не найдено</td></tr>';
      return;
    }

    pagesBody.innerHTML = filtered.map((page) => {
      const seoComplete = page.canonical_self && page.h1_count === 1 && page.og_present;
      const seoLabel = seoComplete ? "complete" : "partial";
      return `<tr>
        <td><span class="badge">${escapeHtml(page.category)}</span></td>
        <td><a href="${escapeHtml(page.url)}" target="_blank" rel="noreferrer">${escapeHtml(page.title || page.path)}</a><span class="path">${escapeHtml(page.path)}</span></td>
        <td>${escapeHtml(page.lastmod || "—")}</td>
        <td>${escapeHtml(page.main_word_count ?? "—")}</td>
        <td>${escapeHtml(page.h2_count ?? "—")}</td>
        <td>${escapeHtml(page.internal_link_targets ?? "—")}</td>
        <td><span class="seo ${seoComplete ? "" : "partial"}">${seoLabel}</span></td>
      </tr>`;
    }).join("");
  };

  [query, category, status].forEach((control) => control.addEventListener("input", render));
  render();
})();

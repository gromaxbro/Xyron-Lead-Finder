let progressInterval = null;
let taskId = Date.now().toString();
let allLeads = [];
let smartFilterActive = false;

const tableBody = document.getElementById("tableBody");
const wrapper = document.querySelector(".table-wrapper");
const saveBtn = document.getElementById("saveLeads");
const selectAllBox = document.getElementById("selectAllLeads");
const resultsSummary = document.getElementById("resultsSummary");
const selectedCountEl = document.getElementById("selectedCount");
const smartLeadsBtn = document.getElementById("smartLeadsBtn");
const filterIds = [
  "leadSearch",
  "scoreFilter",
  "websiteFilter",
  "instagramFilter",
  "speedFilter",
];

function textValue(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  return String(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function csvEscape(value) {
  const clean = String(value ?? "")
    .replace(/\r?\n|\r/g, " ")
    .trim();
  return /[",]/.test(clean) ? `"${clean.replace(/"/g, '""')}"` : clean;
}

function getLoadingMessage(percent) {
  if (percent < 35) return "Scanning Google Maps...";
  if (percent < 75) return "Analyzing websites...";
  return "Finalizing lead list...";
}

function getTagBadge(tag) {
  const lower = String(tag || "").toLowerCase();
  let badgeClass = "tag-badge neutral";

  if (lower.includes("no website") || lower.includes("no instagram")) {
    badgeClass = "tag-badge danger";
  } else if (lower.includes("slow")) {
    badgeClass = "tag-badge warning";
  } else if (lower && lower !== "-") {
    badgeClass = "tag-badge success";
  }

  return `<span class="${badgeClass}">${escapeHtml(tag)}</span>`;
}

function getWebsiteCell(lead) {
  if (lead.website && lead.website !== "None" && lead.website !== "-") {
    return `<a href="${escapeHtml(
      lead.website
    )}" target="_blank" rel="noopener noreferrer" class="icon-link" title="${escapeHtml(
      lead.website
    )}">🌐<span class="sr-only">Has Website</span></a>`;
  }
  return `<span class="icon-muted">❌<span class="sr-only">No Website</span></span>`;
}

function getSpeedCell(speed) {
  const label = textValue(speed, "N/A");
  let icon = "⚪";

  if (label.includes("Fast")) icon = "🟢";
  else if (label.includes("Medium")) icon = "🟡";
  else if (label.includes("Slow")) icon = "🔴";

  return `<span class="speed-pill" title="${escapeHtml(
    label
  )}">${icon}<span class="sr-only">${escapeHtml(label)}</span></span>`;
}

function getSocialCell(social) {
  if (social?.instagram) {
    return `<a href="${escapeHtml(
      social.instagram
    )}" target="_blank" rel="noopener noreferrer" class="icon-link" title="Instagram">📷<span class="sr-only">Instagram Present</span></a>`;
  }
  return `<span class="icon-muted">❌<span class="sr-only">Instagram Missing</span></span>`;
}

function updateWrapperState() {
  const rows = [...tableBody.querySelectorAll("tr")];
  if (rows.length === 0) wrapper.classList.add("no-scroll");
  else wrapper.classList.remove("no-scroll");
}

function updateResultSummary() {
  const visibleRows = [...document.querySelectorAll("#tableBody tr")].filter(
    (row) => row.style.display !== "none" && !row.classList.contains("empty-row")
  );
  resultsSummary.textContent = `${visibleRows.length} visible leads`;
}

function updateSelectionUI() {
  const checkboxes = [...document.querySelectorAll(".lead-check")];
  const checked = checkboxes.filter((box) => box.checked);
  const visibleBoxes = checkboxes.filter(
    (box) => box.closest("tr") && box.closest("tr").style.display !== "none"
  );

  selectedCountEl.textContent = `${checked.length} selected`;
  saveBtn.textContent = `Save Selected (${checked.length})`;
  saveBtn.disabled = checked.length === 0;

  if (visibleBoxes.length === 0) {
    selectAllBox.checked = false;
    selectAllBox.indeterminate = false;
    return;
  }

  const checkedVisible = visibleBoxes.filter((box) => box.checked).length;
  selectAllBox.checked = checkedVisible === visibleBoxes.length;
  selectAllBox.indeterminate =
    checkedVisible > 0 && checkedVisible < visibleBoxes.length;
}

function applyFilters() {
  const searchValue =
    document.getElementById("leadSearch")?.value?.toLowerCase().trim() || "";
  const scoreValue =
    document.getElementById("scoreFilter")?.value?.toLowerCase() || "";
  const websiteValue =
    document.getElementById("websiteFilter")?.value?.toLowerCase() || "";
  const instagramValue =
    document.getElementById("instagramFilter")?.value?.toLowerCase() || "";
  const speedValue =
    document.getElementById("speedFilter")?.value?.toLowerCase() || "";

  [...document.querySelectorAll("#tableBody tr")].forEach((row) => {
    if (row.classList.contains("empty-row")) return;

    const nameText = row.children[1]?.textContent?.toLowerCase().trim() || "";
    const emailsText = row.children[3]?.textContent?.toLowerCase().trim() || "";
    const websiteText =
      row.children[4]?.textContent?.toLowerCase().trim() || "";
    const speedText = row.children[7]?.textContent?.toLowerCase().trim() || "";
    const socialsText =
      row.children[8]?.textContent?.toLowerCase().trim() || "";
    const scoreText = row.children[9]?.textContent?.toLowerCase().trim() || "";

    const matchesSearch =
      !searchValue ||
      nameText.includes(searchValue) ||
      emailsText.includes(searchValue);

    const matchesScore = !scoreValue || scoreText.includes(scoreValue);
    const matchesWebsite =
      !websiteValue ||
      (websiteValue === "has"
        ? websiteText && !websiteText.includes("❌")
        : !websiteText || websiteText.includes("❌"));
    const matchesInstagram =
      !instagramValue ||
      (instagramValue === "has"
        ? socialsText.includes("📷")
        : !socialsText.includes("📷"));
    const matchesSpeed = !speedValue || speedText.includes(speedValue);
    const matchesSmart =
      !smartFilterActive ||
      ((scoreText.includes("high") || scoreText.includes("medium")) &&
        (!websiteText || websiteText.includes("❌")) &&
        !socialsText.includes("📷"));

    row.style.display =
      matchesSearch &&
      matchesScore &&
      matchesWebsite &&
      matchesInstagram &&
      matchesSpeed &&
      matchesSmart
        ? ""
        : "none";
  });

  updateResultSummary();
  updateSelectionUI();
}

function updateStats(leads) {
  let down = 0;
  let none = 0;
  let highScore = 0;
  let noInstagram = 0;
  let fastSites = 0;

  leads.forEach((lead) => {
    if (!lead.website || lead.website === "None") none += 1;
    if (lead.status === "down") down += 1;
    if (String(lead.score || "").includes("High")) highScore += 1;
    if (!lead.social?.instagram) noInstagram += 1;
    if (String(lead.speed || "").includes("Fast")) fastSites += 1;
  });

  document.getElementById("total").innerText = leads.length;
  document.getElementById("down").innerText = down;
  document.getElementById("none").innerText = none;
  document.getElementById("highScore").innerText = highScore;
  document.getElementById("noInstagram").innerText = noInstagram;
  document.getElementById("fastSites").innerText = fastSites;
}

function renderEmptyState(message = "No leads found") {
  tableBody.innerHTML = `<tr class="empty-row"><td colspan="13" class="empty-row">${message}</td></tr>`;
  updateWrapperState();
  updateResultSummary();
  updateSelectionUI();
}

function renderLeads(leads) {
  tableBody.innerHTML = "";

  if (!leads.length) {
    renderEmptyState();
    return;
  }

  leads.forEach((lead, index) => {
    const tags = Array.isArray(lead.tags) ? lead.tags : [];
    const tagMarkup = tags.length
      ? tags.map(getTagBadge).join("")
      : `<span class="tag-badge neutral">-</span>`;

    tableBody.innerHTML += `
      <tr>
        <td><input type="checkbox" class="lead-check" data-id="${index}"></td>
        <td>${escapeHtml(textValue(lead.name))}</td>
        <td>${escapeHtml(textValue(lead.phone))}</td>
        <td>${escapeHtml(textValue(lead.emails))}</td>
        <td>${getWebsiteCell(lead)}</td>
        <td class="status-${escapeHtml(
          textValue(lead.status, "unknown")
        )}">${escapeHtml(textValue(lead.status))}</td>
        <td>${escapeHtml(textValue(lead.reviews))}</td>
        <td>${getSpeedCell(lead.speed)}</td>
        <td>${getSocialCell(lead.social)}</td>
        <td>${escapeHtml(textValue(lead.score))}</td>
        <td class="tag-cell">${tagMarkup}</td>
        <td id="insight-${index}">
          <button class="ai-btn" onclick="getInsight(${index})">🤖 Generate</button>
        </td>
      </tr>
    `;
  });

  updateWrapperState();
  applyFilters();
}

async function getInsight(index) {
  const lead = allLeads[index];
  const container = document.getElementById(`insight-${index}`);
  if (!lead || !container) return;

  container.innerHTML = `<span class="insight-loading">Generating...</span>`;

  try {
    const res = await fetch("/ai-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });

    const data = await res.json();
    container.innerHTML = `<div class="insight-badge">${escapeHtml(
      data.insight || "No insight"
    )}</div>`;
  } catch (err) {
    container.innerHTML = `<span class="insight-error">Error</span>`;
  }
}

function showLoading(total) {
  document.getElementById("loadingOverlay").style.display = "flex";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressPercent").innerText = "0%";
  document.getElementById("loadingText").innerText = "Scanning Google Maps...";

  if (progressInterval) clearInterval(progressInterval);

  progressInterval = setInterval(async () => {
    const res = await fetch(`/progress/${taskId}`);
    const current = Number(await res.text());
    const percent = Math.min(100, Math.floor((current / total) * 100));

    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("progressPercent").innerText = percent + "%";
    document.getElementById("loadingText").innerText = getLoadingMessage(percent);

    if (current >= total) clearInterval(progressInterval);
  }, 1000);
}

function hideLoading() {
  if (progressInterval) clearInterval(progressInterval);
  document.getElementById("loadingOverlay").style.display = "none";
}

async function saveSelectedLeads() {
  const checked = [...document.querySelectorAll(".lead-check:checked")];
  const selectedLeads = checked
    .map((box) => allLeads[box.dataset.id])
    .filter(Boolean);

  if (!selectedLeads.length) {
    alert("No leads selected");
    return;
  }

  try {
    await fetch("add-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedLeads),
    });
    alert("Leads saved to backend ✅");
  } catch (err) {
    console.error(err);
    alert("Error saving leads");
  }
}

filterIds.forEach((id) => {
  const el = document.getElementById(id);
  const eventName = id === "leadSearch" ? "input" : "change";
  el?.addEventListener(eventName, () => {
    if (id !== "leadSearch") {
      smartFilterActive = false;
      smartLeadsBtn.classList.remove("active");
    }
    applyFilters();
  });
});

smartLeadsBtn?.addEventListener("click", () => {
  smartFilterActive = !smartFilterActive;
  smartLeadsBtn.classList.toggle("active", smartFilterActive);
  if (smartFilterActive) {
    document.getElementById("scoreFilter").value = "";
    document.getElementById("websiteFilter").value = "";
    document.getElementById("instagramFilter").value = "";
    document.getElementById("speedFilter").value = "";
  }
  applyFilters();
});

selectAllBox?.addEventListener("change", () => {
  const visibleBoxes = [...document.querySelectorAll(".lead-check")].filter(
    (box) => box.closest("tr") && box.closest("tr").style.display !== "none"
  );
  visibleBoxes.forEach((box) => {
    box.checked = selectAllBox.checked;
  });
  updateSelectionUI();
});

tableBody?.addEventListener("change", (event) => {
  if (event.target.classList.contains("lead-check")) updateSelectionUI();
});

saveBtn?.addEventListener("click", saveSelectedLeads);

document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = document.querySelector("[name='type']").value;
  const region = document.querySelector("[name='region']").value;
  const limit = document.getElementById("limit").value;

  taskId = Date.now().toString();
  showLoading(limit);

  try {
    const response = await fetch("/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        region,
        limit,
        task_id: taskId,
      }),
    });

    const leads = await response.json();
    allLeads = Array.isArray(leads) ? leads : [];
    updateStats(allLeads);
    renderLeads(allLeads);
  } catch (err) {
    console.error(err);
    renderEmptyState("Unable to load leads");
  } finally {
    hideLoading();
  }
});

updateStats([]);
renderEmptyState();

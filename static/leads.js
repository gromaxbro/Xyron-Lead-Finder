const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("savedSearch");
const feedback = document.getElementById("copyFeedback");
const countEl = document.getElementById("savedResultsCount");

function visibleRows() {
  return [...tableBody.querySelectorAll("tr")].filter(
    (row) => row.style.display !== "none" && row.children.length > 1
  );
}

function updateSavedCount() {
  countEl.textContent = `${visibleRows().length} leads`;
}

function applySavedSearch() {
  const query = searchInput?.value?.toLowerCase().trim() || "";

  [...tableBody.querySelectorAll("tr")].forEach((row) => {
    if (row.children.length <= 1) return;

    const haystack = [
      row.children[0]?.textContent || "",
      row.children[1]?.textContent || "",
      row.children[2]?.textContent || "",
      row.children[5]?.textContent || "",
    ]
      .join(" ")
      .toLowerCase();

    row.style.display = !query || haystack.includes(query) ? "" : "none";
  });

  updateSavedCount();
}

function collectColumnValues(index) {
  return visibleRows()
    .map((row) => row.children[index]?.textContent?.trim() || "")
    .filter((value) => value && value !== "-" && value !== "❌");
}

async function copyValues(values, successText) {
  if (!values.length) {
    feedback.textContent = "Nothing to copy";
    return;
  }

  try {
    await navigator.clipboard.writeText(values.join("\n"));
    feedback.textContent = successText;
  } catch (err) {
    feedback.textContent = "Copy failed";
  }
}

function csvEscape(value) {
  const clean = String(value ?? "")
    .replace(/\r?\n|\r/g, " ")
    .trim();
  return /[",]/.test(clean) ? `"${clean.replace(/"/g, '""')}"` : clean;
}

function exportSavedCsv() {
  const headers = ["Name", "Phone", "Emails", "Website", "Social", "Address"];
  const csvRows = [headers.map(csvEscape).join(",")];

  visibleRows().forEach((row) => {
    const values = [
      row.children[0]?.textContent || "",
      row.children[1]?.textContent || "",
      row.children[2]?.textContent || "",
      row.children[3]?.textContent || "",
      row.children[4]?.textContent || "",
      row.children[5]?.textContent || "",
    ];
    csvRows.push(values.map(csvEscape).join(","));
  });

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "saved-leads.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

document.getElementById("copyEmailsBtn")?.addEventListener("click", () => {
  copyValues(collectColumnValues(2), "Emails copied");
});

document.getElementById("copyPhonesBtn")?.addEventListener("click", () => {
  copyValues(collectColumnValues(1), "Phones copied");
});

document.getElementById("exportSavedCsvBtn")?.addEventListener("click", exportSavedCsv);

document.getElementById("clearBtn")?.addEventListener("click", async () => {
  try {
    await fetch("/clear-leads");
    window.location.reload();
  } catch (err) {
    feedback.textContent = "Unable to clear leads";
  }
});

searchInput?.addEventListener("input", applySavedSearch);

applySavedSearch();

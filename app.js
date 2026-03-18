let leads = [];

async function searchLeads() {
  const type = document.getElementById("typeInput").value;
  const region = document.getElementById("regionInput").value;

  console.log("Searching:", type, region);
  document.getElementById("results").innerHTML =
    "<tr><td colspan='5'>Searching leads...</td></tr>";
  try {
    const response = await fetch(
      `/search?type=${encodeURIComponent(type)}&region=${encodeURIComponent(region)}`,
    );

    const data = await response.json();

    leads = data;

    renderTable();
    updateStats();
  } catch (err) {
    console.error("Failed to fetch leads:", err);
  }
}

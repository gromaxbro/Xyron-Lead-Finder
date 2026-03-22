const table = document.getElementById("savedTable");
const empty = document.getElementById("emptyState");

let saved = JSON.parse(localStorage.getItem("savedLeads")) || [];

function render() {
  table.innerHTML = "";

  if (saved.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  saved.forEach((l, index) => {
    let website =
      l.website && l.website !== "None"
        ? `<a href="${l.website}" target="_blank">Visit</a>`
        : "None";

    table.innerHTML += `
        <tr>
            <td>${l.name}</td>
            <td>${l.phone || "-"}</td>
            <td>${website}</td>
            <td>
                <button class="action-btn" onclick="removeLead(${index})">
                    Delete
                </button>
            </td>
        </tr>
        `;
  });
}

/* delete */

function removeLead(index) {
  saved.splice(index, 1);
  localStorage.setItem("savedLeads", JSON.stringify(saved));
  render();
}

/* clear all */

document.getElementById("clearBtn").onclick = () => {
  localStorage.removeItem("savedLeads");
  saved = [];
  render();
};

render();

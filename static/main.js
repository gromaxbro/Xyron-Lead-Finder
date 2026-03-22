let progressInterval = null;
let taskId = Date.now().toString();

async function getInsight(index) {
  let lead = allLeads[index];

  let container = document.getElementById(`insight-${index}`);

  // show loading
  container.innerHTML = "🔄 Generating...";

  try {
    let res = await fetch("/ai-insight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lead),
    });

    let data = await res.json();

    // 🔥 replace button completely
    container.innerHTML = `
      <div class="insight-badge">
        ✨ ${data.insight}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<span class="insight-error">Error</span>`;
  }
}
function showLoading(total) {
  document.getElementById("loadingOverlay").style.display = "flex";

  progressInterval = setInterval(async () => {
    let res = await fetch(`/progress/${taskId}`);
    let current = Number(await res.text()); // just number

    let percent = Math.floor((current / total) * 100);

    // Update UI
    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("progressPercent").innerText = percent + "%";

    document.getElementById("loadingText").innerText = `Extracting leads...`;

    // stop when done
    if (current >= total) {
      clearInterval(progressInterval);
    }
  }, 1000);
}

// HIDE loader
function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}
let allLeads = [];
let wrapper = document.querySelector(".table-wrapper");

if (allLeads.length === 0) {
  wrapper.classList.add("no-scroll");
} else {
  wrapper.classList.remove("no-scroll");
}
let table = document.getElementById("tableBody");

if (allLeads.length === 0) {
  table.innerHTML = `
    <tr>
      <td colspan="100%" style="text-align:center; padding:20px;">
        No leads found
      </td>
    </tr>
  `;
}
document
  .getElementById("searchForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    let type = document.querySelector("[name='type']").value;
    let region = document.querySelector("[name='region']").value;
    let limit = document.getElementById("limit").value;

    showLoading(limit);
    let response = await fetch("/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: type,
        region: region,
        limit: limit,
        task_id: taskId,
      }),
    });

    let leads = await response.json();

    // const dummyLeads = [
    //   {
    //     name: "Timezone Pacific Mall Tagore Garden - Arcade Games, VR Rabbits & Prizes",
    //     phone: "095493 08309",
    //     emails: ["info@timezoneindia.com"],
    //     website: "https://timezonegames.com",
    //     status: "ok",
    //     reviews: "4.9",
    //     speed: "🟢 Fast",
    //     social: {
    //       instagram: "https://instagram.com/timezone",
    //       facebook: "https://facebook.com/timezone",
    //     },
    //     address:
    //       "3rd Floor, Pacific Mall, Unit No. TF-05, Najafgarh Rd, Tagore Garden, New Delhi, Delhi 110018",
    //   },

    //   {
    //     name: "Level Up Gaming",
    //     phone: "098183 78375",
    //     emails: [],
    //     website: null,
    //     status: "none",
    //     reviews: "4.9",
    //     speed: null,
    //     social: {},
    //     address:
    //       "Wz-3a/54, Block WZ, Shyam Nagar, Vishnu Garden, New Delhi, Delhi, 110018",
    //   },

    //   {
    //     name: "Strike Casino By Big Daddy",
    //     phone: "089998 89998",
    //     emails: ["enquiry@bigdaddystrike.com"],
    //     website: "https://bigdaddystrike.com",
    //     status: "ok",
    //     reviews: "4.5",
    //     speed: "🟡 Medium",
    //     social: {
    //       instagram: "https://instagram.com/bigdaddy",
    //       facebook: "https://facebook.com/bigdaddy",
    //     },
    //     address: "Block No.4 North Wing, Casino Complex, Goa, India",
    //   },

    //   {
    //     name: "XGT Gaming Lounge",
    //     phone: "088269 13868",
    //     emails: [],
    //     website: null,
    //     status: "none",
    //     reviews: "4.4",
    //     speed: null,
    //     social: {},
    //     address:
    //       "1st Floor, 29, above Subway, Hansraj College, Block UA, Jawahar Nagar, Kamla Nagar, New Delhi, Delhi, 110007",
    //   },

    //   {
    //     name: "Zoreko - Original Gamers Rajouri Garden",
    //     phone: "093550 02192",
    //     emails: ["info@zoreko.com", "support@zoreko.com"],
    //     website: "https://zoreko.com",
    //     status: "ok",
    //     reviews: "4.8",
    //     speed: "🟢 Fast",
    //     social: {
    //       instagram: "https://instagram.com/zoreko",
    //     },
    //     address:
    //       "Rcube Monad, 4th Floor Najafgarh Road, Shivaji Marg, Rajouri Garden Extension, New Delhi",
    //   },

    //   {
    //     name: "Super Ultra Mega Long Name Gaming Cafe That Breaks Your Entire UI Layout Testing Purpose Only",
    //     phone: "070000 00000",
    //     emails: ["verylongemailaddressfortestinguioverflow@gmail.com"],
    //     website: "https://averyveryverylongdomainnameexampletesting.com",
    //     status: "ok",
    //     reviews: "5.0",
    //     speed: "🔴 Slow",
    //     social: {},
    //     address:
    //       "This is a super long address that is intentionally designed to break your layout and test overflow behavior in your table UI properly so you can fix it",
    //   },
    // ];
    // let leads = dummyLeads;
    // SHOW loader

    let table = document.getElementById("tableBody");

    allLeads = leads;

    console.log(leads);
    table.innerHTML = "";

    let down = 0;
    let none = 0;

    leads.forEach((l, index) => {
      if (!l.website || l.website === "None") {
        none++;
      }

      if (l.status === "down") {
        down++;
      }

      let website = l.website
        ? `<a href="${l.website}" target="_blank">Visit</a>`
        : "None";

      let socialHTML = "";

      if (l.social) {
        if (l.social.instagram) {
          socialHTML += `
            <a href="${l.social.instagram}" target="_blank" class="social-btn ig">
              📷 Instagram
            </a>
          `;
        }

        if (l.social.facebook) {
          socialHTML += `
            <a href="${l.social.facebook}" target="_blank" class="social-btn fb">
              👍 Facebook
            </a>
          `;
        }

        if (l.social.whatsapp) {
          socialHTML += `
            <a href="${l.social.whatsapp}" target="_blank" class="social-btn wa">
              💬 WhatsApp
            </a>
          `;
        }
      }

      if (!socialHTML) {
        socialHTML = `<span class="no-social">⚫ None</span>`;
      }

      table.innerHTML += `

<tr>
<td><input type="checkbox" class="lead-check" data-id="${index}"></td>
<td>${l.name}</td>

<td>${l.phone}</td>
<td>${l.emails}</td>
<td>${website}</td>

<td class="status-${l.status}">${l.status}</td>

<td>${l.reviews}</td
>
<td>${l.speed ?? "N/A"}</td>
<td>${socialHTML}</td>
<td class="address" title="${l.address}">
  ${l.address || "-"}
</td>
<td>${l.score}</td>

<td>
  ${l.tags?.length ? l.tags.join(", ") : "-"}
</td>
<td id="insight-${index}">
  <button class="ai-btn" onclick="getInsight(${index})">
    🤖 Generate
  </button>
</td>
</tr>

`;
    });

    document.getElementById("total").innerText = leads.length;
    document.getElementById("down").innerText = down;
    document.getElementById("none").innerText = none;

    hideLoading();

    const saveBtn = document.getElementById("saveLeads");

    if (leads.length > 0) {
      saveBtn.disabled = false;
    } else {
      saveBtn.disabled = true;
    }

    if (leads.length === 0) {
      wrapper.classList.add("no-scroll");
    } else {
      wrapper.classList.remove("no-scroll");
    }
    saveBtn.addEventListener("click", async () => {
      const checked = [...document.querySelectorAll(".lead-check:checked")];

      const selectedLeads = checked.map((box) => allLeads[box.dataset.id]);

      if (selectedLeads.length === 0) {
        alert("No leads selected");
        return;
      }

      try {
        const res = await fetch("add-leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedLeads),
        });

        const data = await res.json();

        alert("Leads saved to backend ✅");
      } catch (err) {
        console.error(err);
        alert("Error saving leads");
      }
    });
  });

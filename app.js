const alerts = [
  {
    title: "Credential stuffing pattern detected",
    detail: "Multiple failed logins from 14 IPs in 8 minutes",
    level: "critical"
  },
  {
    title: "VPN login from a new country",
    detail: "Triggered risk-based policy review",
    level: "warning"
  },
  {
    title: "Server CPU spike on finance cluster",
    detail: "Monitoring queue flagged a potential service bottleneck",
    level: "info"
  },
  {
    title: "Unexpected admin role change",
    detail: "Privileged access event correlated with a support ticket",
    level: "critical"
  }
];

const alertsList = document.getElementById("alertsList");
const lastSync = document.getElementById("lastSync");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeToggle = document.getElementById("themeToggle");
const searchInput = document.getElementById("alertSearch");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const dashboardGrid = document.querySelector(".dashboard-grid");
const panels = Array.from(document.querySelectorAll(".panel"));
const trendLine = document.getElementById("trendLine");
const trendDotA = document.getElementById("trendDotA");
const trendDotB = document.getElementById("trendDotB");
const trendDotC = document.getElementById("trendDotC");
let activeFilter = "all";
let searchText = "";
let chartValues = [30, 44, 56, 68, 62, 74];

function getFilteredAlerts() {
  const query = searchText.trim().toLowerCase();
  return alerts.filter((alert) => {
    const matchesFilter = activeFilter === "all" ? true : alert.level === activeFilter;
    const matchesSearch = !query || `${alert.title} ${alert.detail}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });
}

function renderAlerts() {
  const visibleAlerts = getFilteredAlerts();

  if (!visibleAlerts.length) {
    alertsList.innerHTML = '<tr><td colspan="3"><span class="subtitle">No alerts match this filter.</span></td></tr>';
    return;
  }

  alertsList.innerHTML = visibleAlerts
    .map(
      (alert) => `
        <tr>
          <td>
            <strong>${alert.title}</strong>
          </td>
          <td class="subtitle">${alert.detail}</td>
          <td><span class="badge ${alert.level}">${alert.level}</span></td>
        </tr>
      `
    )
    .join("");
}

function updateClock() {
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
  lastSync.textContent = time;
}

function updateThemeLabel() {
  const isLight = document.body.classList.contains("light-theme");
  themeToggle.textContent = isLight ? "🌙 Dark mode" : "☀ Light mode";
}

function buildPath(values) {
  const width = 380;
  const height = 120;
  const min = 20;
  const max = 100;
  return values
    .map((value, index) => {
      const x = 20 + index * ((width - 40) / (values.length - 1));
      const y = height - ((value - min) / (max - min)) * 100;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function updateChart() {
  const nextValue = Math.max(20, Math.min(90, chartValues[chartValues.length - 1] + Math.round(Math.random() * 14 - 7)));
  chartValues.push(nextValue);
  chartValues.shift();
  const path = buildPath(chartValues);
  trendLine.setAttribute("d", path);
  const [a, b, c] = chartValues.slice(-3);
  const dotY = (value) => 120 - ((value - 20) / 80) * 100;
  trendDotA.setAttribute("cx", 20 + 3 * ((380 - 40) / 5));
  trendDotA.setAttribute("cy", dotY(a));
  trendDotB.setAttribute("cx", 20 + 4 * ((380 - 40) / 5));
  trendDotB.setAttribute("cy", dotY(b));
  trendDotC.setAttribute("cx", 20 + 5 * ((380 - 40) / 5));
  trendDotC.setAttribute("cy", dotY(c));
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    renderAlerts();
  });
});

searchInput.addEventListener("input", (event) => {
  searchText = event.target.value;
  renderAlerts();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  localStorage.setItem("siem-theme", isLight ? "light" : "dark");
  updateThemeLabel();
});

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

let draggedPanel = null;
panels.forEach((panel) => {
  panel.setAttribute("draggable", "true");

  panel.addEventListener("dragstart", (event) => {
    draggedPanel = panel;
    panel.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  });

  panel.addEventListener("dragend", () => {
    draggedPanel = null;
    panel.classList.remove("dragging");
    panels.forEach((item) => item.classList.remove("drop-target"));
  });

  panel.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (draggedPanel && panel !== draggedPanel) {
      panel.classList.add("drop-target");
    }
  });

  panel.addEventListener("dragleave", () => {
    panel.classList.remove("drop-target");
  });

  panel.addEventListener("drop", (event) => {
    event.preventDefault();
    if (!draggedPanel || panel === draggedPanel) {
      return;
    }

    const currentIndex = panels.indexOf(draggedPanel);
    const targetIndex = panels.indexOf(panel);
    const referenceNode = panel.nextElementSibling;

    if (currentIndex < targetIndex) {
      dashboardGrid.insertBefore(draggedPanel, referenceNode);
    } else {
      dashboardGrid.insertBefore(draggedPanel, panel);
    }

    panels.splice(currentIndex, 1);
    panels.splice(targetIndex, 0, draggedPanel);
    panels.forEach((item) => item.classList.remove("drop-target"));
  });
});

const storedTheme = localStorage.getItem("siem-theme");
if (storedTheme === "light") {
  document.body.classList.add("light-theme");
}

renderAlerts();
updateClock();
updateThemeLabel();
updateChart();
setInterval(updateClock, 15000);
setInterval(updateChart, 2200);

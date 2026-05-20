const packetsMetric = document.querySelector("#packetsMetric");
const scoreMetric = document.querySelector("#scoreMetric");
const threatMetric = document.querySelector("#threatMetric");
const statusMetric = document.querySelector("#statusMetric");
const alertList = document.querySelector("#alertList");
const alertCount = document.querySelector("#alertCount");
const protocolList = document.querySelector("#protocolList");
const siemLog = document.querySelector("#siemLog");
const pauseBtn = document.querySelector("#pauseBtn");
const severityFilter = document.querySelector("#severityFilter");
const pageTitle = document.querySelector("#pageTitle");
const navItems = document.querySelectorAll(".nav-item");
const panels = document.querySelectorAll("[data-page]");
const canvas = document.querySelector("#trafficCanvas");
const ctx = canvas.getContext("2d");

const protocols = [
  { name: "HTTPS", value: 42 },
  { name: "HTTP", value: 24 },
  { name: "DNS", value: 16 },
  { name: "SSH", value: 8 },
  { name: "Other", value: 10 },
];

const alertTemplates = [
  {
    title: "Port scan detected",
    severity: "high",
    detail: "192.168.1.44 scanned 38 ports in a short burst.",
  },
  {
    title: "Brute force SSH",
    severity: "critical",
    detail: "Repeated failed login attempts against port 22.",
  },
  {
    title: "DNS tunneling pattern",
    severity: "medium",
    detail: "Long DNS query strings suggest possible data exfiltration.",
  },
  {
    title: "Suspicious outbound beacon",
    severity: "critical",
    detail: "Endpoint contacted a known command-and-control address.",
  },
  {
    title: "Unusual traffic spike",
    severity: "medium",
    detail: "Packet rate moved above normal baseline for this segment.",
  },
];

let running = true;
let packets = 340;
let threats = 0;
let score = 18;
let traffic = Array.from({ length: 30 }, () => 120 + Math.random() * 180);
let alerts = [];
let logs = [];

function randomIp() {
  return `192.168.${Math.floor(Math.random() * 6)}.${Math.floor(Math.random() * 220 + 20)}`;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderProtocols() {
  protocolList.innerHTML = protocols
    .map((protocol) => `
      <div class="protocol-row">
        <strong>${protocol.name}</strong>
        <div class="bar"><span style="width:${protocol.value}%"></span></div>
        <span>${protocol.value}%</span>
      </div>
    `)
    .join("");
}

function renderAlerts() {
  const filter = severityFilter.value;
  const visibleAlerts = alerts.filter((alert) => filter === "all" || alert.severity === filter);

  alertCount.textContent = `${alerts.length} active`;
  alertList.innerHTML = visibleAlerts.length
    ? visibleAlerts
        .map((alert) => `
          <article class="alert-item">
            <strong>${alert.title}</strong>
            <span class="severity ${alert.severity}">${alert.severity}</span>
            <p>${alert.time} from ${alert.source}: ${alert.detail}</p>
          </article>
        `)
        .join("")
    : `<article class="alert-item"><strong>No alerts in this view</strong><p>Change the severity filter or wait for new live events.</p></article>`;
}

function renderLogs() {
  siemLog.innerHTML = logs
    .slice(0, 8)
    .map((log) => `
      <article class="log-item">
        <strong>${log.time} ${log.type}</strong>
        <p>${log.message}</p>
      </article>
    `)
    .join("");
}

function drawTraffic() {
  const width = canvas.width;
  const height = canvas.height;
  const maxValue = Math.max(...traffic) + 60;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#09140f";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#3d3520";
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i += 1) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#ffbf2f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  traffic.forEach((value, index) => {
    const x = (index / (traffic.length - 1)) * width;
    const y = height - (value / maxValue) * (height - 24) - 12;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function updateMetrics() {
  packetsMetric.textContent = packets.toLocaleString();
  scoreMetric.textContent = score;
  threatMetric.textContent = threats;

  if (score > 72) {
    statusMetric.textContent = "HIGH";
    statusMetric.style.color = "var(--danger)";
  } else if (score > 45) {
    statusMetric.textContent = "MEDIUM";
    statusMetric.style.color = "var(--warn)";
  } else {
    statusMetric.textContent = "LOW";
    statusMetric.style.color = "var(--gold-soft)";
  }
}

function addAlert() {
  const template = pick(alertTemplates);
  const source = randomIp();
  alerts.unshift({
    ...template,
    source,
    time: formatTime(),
  });
  alerts = alerts.slice(0, 10);
  threats += 1;

  logs.unshift({
    time: formatTime(),
    type: "IDS_ALERT",
    message: `${template.severity.toUpperCase()} event from ${source}: ${template.title}`,
  });
  logs = logs.slice(0, 12);
}

function tick() {
  if (!running) {
    return;
  }

  const spike = Math.random() > 0.82;
  const nextTraffic = 160 + Math.random() * 280 + (spike ? 360 : 0);
  traffic.push(nextTraffic);
  traffic.shift();

  packets = Math.round(nextTraffic * 2.8);
  score = Math.min(99, Math.max(8, Math.round(score * 0.82 + (spike ? 78 : Math.random() * 32) * 0.18)));

  protocols.forEach((protocol) => {
    const movement = Math.round(Math.random() * 8 - 4);
    protocol.value = Math.min(62, Math.max(4, protocol.value + movement));
  });

  if (spike || Math.random() > 0.72) {
    addAlert();
  }

  updateMetrics();
  renderProtocols();
  renderAlerts();
  renderLogs();
  drawTraffic();
}

function setPage(section) {
  const titles = {
    dashboard: "Dashboard",
    alerts: "Threat Alerts",
    siem: "SIEM Logs",
    cases: "Case Study",
  };

  pageTitle.textContent = titles[section];
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.section === section));
  panels.forEach((panel) => {
    const pages = panel.dataset.page.split(" ");
    panel.hidden = !pages.includes(section);
  });
}

navItems.forEach((item) => {
  item.addEventListener("click", () => setPage(item.dataset.section));
});

pauseBtn.addEventListener("click", () => {
  running = !running;
  pauseBtn.textContent = running ? "Pause" : "Resume";
});

severityFilter.addEventListener("change", renderAlerts);

renderProtocols();
renderAlerts();
renderLogs();
drawTraffic();
updateMetrics();
setInterval(tick, 1600);

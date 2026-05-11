
let sessions = JSON.parse(localStorage.getItem("cinemaData") || "[]");

function save(){
  localStorage.setItem("cinemaData", JSON.stringify(sessions));
}

document.getElementById("excelFile").addEventListener("change", handleFile);

function handleFile(e){
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(evt){
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, {type:'array'});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {header:1});

    let currentHall = "";
    sessions = [];

    rows.forEach(row=>{
      const second = row[1];

      if(typeof second === "string" && second.includes("Зал:")){
        currentHall = second.replace("Зал:", "").trim();
      }

      if(row[1] && row[2] && row[3]){
        const start = String(row[1]);

        if(start.includes(":")){
          sessions.push({
            hall: currentHall,
            start: row[1],
            end: row[2],
            movie: row[3],
            checkedAt: null,
            sales: false,
            peoplePresent: false
          });
        }
      }
    });

    save();
    render();
  };

  reader.readAsArrayBuffer(file);
}

function getRemaining(checkTime){
  if(!checkTime) return "Нужна проверка";

  const diff = Date.now() - new Date(checkTime).getTime();
  const mins = Math.floor(diff / 1000 / 60);
  const left = 60 - mins;

  if(left <= 0) return "ПРОСРОЧЕНО";
  return left + " мин осталось";
}

function render(){
  const container = document.getElementById("sessions");
  container.innerHTML = "";

  const grouped = {};

  sessions.forEach((s, i)=>{
    if(!grouped[s.hall]) grouped[s.hall] = [];
    grouped[s.hall].push({...s, index:i});
  });

  Object.keys(grouped).forEach(hallName=>{
    const hallDiv = document.createElement("div");
    hallDiv.className = "hall";

    hallDiv.innerHTML = `<h2>${hallName}</h2>`;

    grouped[hallName].forEach(item=>{
      const diff = item.checkedAt
        ? (Date.now() - new Date(item.checkedAt).getTime()) / 1000 / 60 / 60
        : 999;

      const sessionDiv = document.createElement("div");
      sessionDiv.className = "session " + (diff >= 1 ? "old" : "good");

      sessionDiv.innerHTML = `
        <div>
          <strong>${item.start}</strong><br>
          ${item.end}
        </div>

        <div>
          <strong>${item.movie}</strong>
        </div>

        <div>
          <div class="badge">
            Проверка:
            ${item.checkedAt
              ? new Date(item.checkedAt).toLocaleString()
              : "не проверено"}
          </div>

          <div class="counter">
            ${getRemaining(item.checkedAt)}
          </div>
        </div>

        <div>
          <button onclick="checkSession(${item.index})">
            Проверить зал
          </button>
        </div>

        <div>
          <label>
            <input type="checkbox"
              ${item.sales ? "checked" : ""}
              onchange="toggleSales(${item.index}, this.checked)">
            Есть продажи
          </label>

          <label>
            <input type="checkbox"
              ${item.peoplePresent ? "checked" : ""}
              onchange="togglePeople(${item.index}, this.checked)">
            Люди присутствуют
          </label>
        </div>
      `;

      hallDiv.appendChild(sessionDiv);
    });

    container.appendChild(hallDiv);
  });
}

function checkSession(index){
  sessions[index].checkedAt = new Date().toISOString();
  save();
  render();
}

function toggleSales(index,val){
  sessions[index].sales = val;
  save();
}

function togglePeople(index,val){
  sessions[index].peoplePresent = val;
  save();
}

function resetChecks(){
  sessions.forEach(s=>s.checkedAt=null);
  save();
  render();
}

render();
setInterval(render, 30000);

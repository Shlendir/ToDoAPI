let token;
let tasks = [];
let lastTaskId = "?";

let taskList;
let addTask;

// kui leht on brauseris laetud siis lisame esimesed taskid lehele
window.addEventListener("load", async () => {
  taskList = document.querySelector("#task-list");
  addTask = document.querySelector("#add-task");

  token = document.getElementById("script").getAttribute("token"); // võta {token} backend-ist 
  // api call algus - loe ülesandeid ------------------------------
  try {
    tasks = await fetch(`http://demo2.z-bit.ee/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((result) => result.json());
    if (tasks.length > 0) {
      tasks = await tasks.map((task) => {
        return { id: task.id, name: task.title, completed: task.marked_as_done }; // ümbervormistus
      });
      lastTaskId = tasks[tasks.length - 1].name.split(" ")[1]; // viimane "id"
    } else lastTaskId = 0; // ülesanded puuduvad
  } catch (error) {
    console.log(error);
  } // call lõpp --------------------------------------------------

  tasks.forEach(renderTask);

  // kui nuppu vajutatakse siis lisatakse uus task
  addTask.addEventListener("click", async () => {
    const task = await createTask(); // Teeme kõigepealt lokaalsesse "andmebaasi" uue taski
    if (!task) return;
    const taskRow = createTaskRow(task); // Teeme uue taski HTML elementi mille saaks lehe peale listi lisada
    taskList.appendChild(taskRow); // Lisame taski lehele
  });
});

function renderTask(task) {
  const taskRow = createTaskRow(task);
  taskList.appendChild(taskRow);
}

async function createTask() {
  lastTaskId++;

  let task;
  // api call algus - tee uus ülessanne ---------------------------
  try {
    task = await fetch(`http://demo2.z-bit.ee/tasks`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ title: "Task " + lastTaskId, desc: "" }),
    }).then(async (result) => {
      let res = await result.json();
      if (res.message) return; // tagastas vea
      return { id: res.id, name: res.title, completed: res.marked_as_done }; // ümbervormistus
    });
    if (!task) return;
  } catch (error) {
    console.log(error);
    return;
  } //call lõpp ---------------------------------------------------

  tasks.push(task);
  return task;
}

function createTaskRow(task) {
  let taskRow = document.querySelector('[data-template="task-row"]').cloneNode(true);
  taskRow.removeAttribute("data-template");

  // Täidame vormi väljad andmetega
  const name = taskRow.querySelector("[name='name']");
  name.value = task.name;

  const checkbox = taskRow.querySelector("[name='completed']");
  checkbox.id = `${task.id}@${task.name}`; // access later
  checkbox.checked = task.completed;

  const deleteButton = taskRow.querySelector(".delete-task");
  deleteButton.addEventListener("click", async () => {
    // api call algus - kustuta ülesanne ---------------------------
    try {
      await fetch(`http://demo2.z-bit.ee/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        method: "DELETE",
      });
    } catch (error) {
      console.log(error);
      return;
    } // call lõpp -------------------------------------------------

    taskList.removeChild(taskRow);
    tasks.splice(tasks.indexOf(task), 1);

    // leia eelmine "id"
    if (tasks.length > 0) lastTaskId = tasks[tasks.length - 1].name.split(" ")[1];
    else lastTaskId = 0;
  });

  // Valmistame checkboxi ette vajutamiseks
  hydrateAntCheckboxes(taskRow);
  return taskRow;
}

function createAntCheckbox() {
  const checkbox = document.querySelector('[data-template="ant-checkbox"]').cloneNode(true);
  checkbox.removeAttribute("data-template");
  hydrateAntCheckboxes(checkbox);
  return checkbox;
}

/**
 * See funktsioon aitab lisada eridisainiga checkboxile vajalikud event listenerid
 * @param {HTMLElement} element Checkboxi wrapper element või konteiner element mis sisaldab mitut checkboxi
 */
function hydrateAntCheckboxes(element) {
  const elements = element.querySelectorAll(".ant-checkbox-wrapper");
  for (let i = 0; i < elements.length; i++) {
    let wrapper = elements[i];

    // Kui element on juba töödeldud siis jäta vahele
    if (wrapper.__hydrated) continue;
    wrapper.__hydrated = true;

    const checkbox = wrapper.querySelector(".ant-checkbox");

    // Kontrollime kas checkbox peaks juba olema checked, see on ainult erikujundusega checkboxi jaoks
    const input = wrapper.querySelector(".ant-checkbox-input");
    if (input.checked) {
      checkbox.classList.add("ant-checkbox-checked");
    }

    // Kui inputi peale vajutatakse siis uuendatakse checkboxi kujundust
    input.addEventListener("change", async () => {
      // api call - uuenda ülesannet -------------------------------
      try {
        let [id, name] = input.id.split("@");
        const task = await fetch(`http://demo2.z-bit.ee/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          method: "PUT",
          body: JSON.stringify({ title: name, marked_as_done: input.checked }),
        }).then(async (result) => {
          let res = await result.json();
          if (res.message) return; // tagastas vea
          return { id: res.id, name: res.title, completed: res.marked_as_done }; // ümbervormistus
        });
        if (!task) return;
      } catch (error) {
        console.log(error);
        return;
      } //call lõpp ------------------------------------------------

      checkbox.classList.toggle("ant-checkbox-checked");
    });
  }
}

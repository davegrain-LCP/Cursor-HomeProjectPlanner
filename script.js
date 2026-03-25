const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const FAMILY = [
  { name: "Mum", color: "#2563eb" },
  { name: "Dad", color: "#dc2626" },
  { name: "Daughter", color: "#9333ea" },
  { name: "Son", color: "#16a34a" },
];

const STATUSES = ["To do", "Doing", "Done"];
const STORAGE_KEY = "family-housekeeping-planner-v1";

const taskForm = document.getElementById("task-form");
const taskNameInput = document.getElementById("task-name");
const taskPersonInput = document.getElementById("task-person");
const taskDayInput = document.getElementById("task-day");
const taskStatusInput = document.getElementById("task-status");
const taskPaymentInput = document.getElementById("task-payment");
const weeklyBoard = document.getElementById("weekly-board");
const legend = document.getElementById("legend");
const earningsList = document.getElementById("earnings");
const clearCompletedButton = document.getElementById("clear-completed");
const taskTemplate = document.getElementById("task-template");

let tasks = loadTasks();

init();

function init() {
  populateSelect(taskPersonInput, FAMILY.map((member) => member.name));
  populateSelect(taskDayInput, DAYS);
  populateSelect(taskStatusInput, STATUSES);
  renderLegend();
  renderBoard();

  taskForm.addEventListener("submit", handleCreateTask);
  clearCompletedButton.addEventListener("click", removeDoneTasks);
}

function handleCreateTask(event) {
  event.preventDefault();

  const name = taskNameInput.value.trim();
  const person = taskPersonInput.value;
  const day = taskDayInput.value;
  const status = taskStatusInput.value;
  const payment = sanitizePayment(taskPaymentInput.value);

  if (!name) {
    taskNameInput.focus();
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    name,
    person,
    day,
    status,
    payment,
  };

  tasks.unshift(newTask);
  saveAndRender();
  taskForm.reset();
  taskNameInput.focus();
}

function removeDoneTasks() {
  tasks = tasks.filter((task) => task.status !== "Done");
  saveAndRender();
}

function renderLegend() {
  legend.innerHTML = "";
  FAMILY.forEach((member) => {
    const li = document.createElement("li");
    li.className = "legend-item";
    li.innerHTML = `
      <span class="legend-dot" style="background: ${member.color}"></span>
      <span>${member.name}</span>
    `;
    legend.appendChild(li);
  });

  renderEarnings();
}

function renderEarnings() {
  earningsList.innerHTML = "";
  const totals = calculateEarningsByPerson();
  FAMILY.forEach((member) => {
    const li = document.createElement("li");
    li.className = "earnings-item";
    li.innerHTML = `
      <span class="legend-dot" style="background: ${member.color}"></span>
      <span class="earnings-name">${member.name}</span>
      <strong class="earnings-value">£${totals[member.name]}</strong>
    `;
    earningsList.appendChild(li);
  });
}

function renderBoard() {
  weeklyBoard.innerHTML = "";

  DAYS.forEach((day) => {
    const dayColumn = document.createElement("section");
    dayColumn.className = "day-column";
    dayColumn.dataset.day = day;
    dayColumn.setAttribute("aria-label", `${day} tasks`);

    dayColumn.innerHTML = `
      <header class="day-column-header">
        <h3>${day}</h3>
        <span class="task-count">${countTasksForDay(day)} task(s)</span>
      </header>
      <div class="day-dropzone" data-day="${day}"></div>
    `;

    addDropzoneBehavior(dayColumn.querySelector(".day-dropzone"));
    weeklyBoard.appendChild(dayColumn);

    renderTasksForDay(day);
  });
}

function renderTasksForDay(day) {
  const dropzone = weeklyBoard.querySelector(`.day-dropzone[data-day="${day}"]`);
  const dayTasks = tasks.filter((task) => task.day === day);
  const taskCountLabel = weeklyBoard
    .querySelector(`.day-column[data-day="${day}"] .task-count`);

  taskCountLabel.textContent = `${dayTasks.length} task(s)`;
  dropzone.innerHTML = "";

  if (!dayTasks.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-day";
    emptyState.textContent = "No tasks yet";
    dropzone.appendChild(emptyState);
    return;
  }

  dayTasks.forEach((task) => {
    const taskNode = buildTaskNode(task);
    dropzone.appendChild(taskNode);
  });
}

function buildTaskNode(task) {
  const fragment = taskTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".task-card");
  const taskName = fragment.querySelector(".task-name");
  const taskAssignee = fragment.querySelector(".task-assignee");
  const renameBtn = fragment.querySelector(".rename-btn");
  const deleteBtn = fragment.querySelector(".delete-btn");
  const statusSelect = fragment.querySelector(".task-status-select");
  const personSelect = fragment.querySelector(".task-person-select");
  const daySelect = fragment.querySelector(".task-day-select");
  const paymentInput = fragment.querySelector(".task-payment-input");
  const personMeta = FAMILY.find((member) => member.name === task.person);

  card.dataset.taskId = task.id;
  card.style.borderLeft = `6px solid ${personMeta.color}`;
  card.addEventListener("dragstart", onTaskDragStart);
  card.addEventListener("dragend", onTaskDragEnd);

  taskName.textContent = task.name;
  taskAssignee.textContent = `Assigned to ${task.person}`;
  taskAssignee.style.color = personMeta.color;

  populateSelect(statusSelect, STATUSES, task.status);
  populateSelect(
    personSelect,
    FAMILY.map((member) => member.name),
    task.person,
  );
  populateSelect(daySelect, DAYS, task.day);
  paymentInput.value = task.payment ?? 0;

  if (task.status === "Done") {
    card.classList.add("task-done");
  }

  statusSelect.addEventListener("change", (event) => {
    updateTask(task.id, { status: event.target.value });
  });
  personSelect.addEventListener("change", (event) => {
    updateTask(task.id, { person: event.target.value });
  });
  daySelect.addEventListener("change", (event) => {
    updateTask(task.id, { day: event.target.value });
  });
  paymentInput.addEventListener("change", (event) => {
    updateTask(task.id, { payment: sanitizePayment(event.target.value) });
  });
  renameBtn.addEventListener("click", () => renameTask(task));
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  return fragment;
}

function renameTask(task) {
  const nextName = window.prompt("Rename task", task.name);
  if (nextName === null) {
    return;
  }
  const trimmedName = nextName.trim();
  if (!trimmedName) {
    return;
  }
  updateTask(task.id, { name: trimmedName });
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveAndRender();
}

function addDropzoneBehavior(dropzone) {
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("drag-over");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("drag-over");
  });

  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("drag-over");
    const taskId = event.dataTransfer.getData("text/task-id");
    const targetDay = dropzone.dataset.day;
    if (taskId && targetDay) {
      updateTask(taskId, { day: targetDay });
    }
  });
}

function onTaskDragStart(event) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/task-id", event.currentTarget.dataset.taskId);
  event.currentTarget.classList.add("dragging");
}

function onTaskDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
}

function populateSelect(selectElement, options, selectedValue = "") {
  selectElement.innerHTML = "";
  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    if (value === selectedValue) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

function updateTask(taskId, patch) {
  tasks = tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...patch,
        }
      : task,
  );
  saveAndRender();
}

function saveAndRender() {
  saveTasks(tasks);
  renderEarnings();
  renderBoard();
}

function saveTasks(nextTasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return seedTasks();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return seedTasks();
    }
    return parsed.map(normalizeTask).filter(Boolean);
  } catch (error) {
    return seedTasks();
  }
}

function seedTasks() {
  return [
    {
      id: crypto.randomUUID(),
      name: "Vacuum living room",
      person: "Mum",
      day: "Monday",
      status: "To do",
      payment: 5,
    },
    {
      id: crypto.randomUUID(),
      name: "Wash dishes",
      person: "Dad",
      day: "Tuesday",
      status: "Doing",
      payment: 4,
    },
    {
      id: crypto.randomUUID(),
      name: "Take out trash",
      person: "Son",
      day: "Tuesday",
      status: "Done",
      payment: 3,
    },
  ];
}

function isTaskShapeValid(task) {
  return (
    typeof task?.id === "string" &&
    typeof task?.name === "string" &&
    FAMILY.some((member) => member.name === task.person) &&
    DAYS.includes(task.day) &&
    STATUSES.includes(task.status)
  );
}

function countTasksForDay(day) {
  return tasks.filter((task) => task.day === day).length;
}

function sanitizePayment(rawValue) {
  const numeric = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return numeric;
}

function normalizeTask(task) {
  if (!isTaskShapeValid(task)) {
    return null;
  }
  return {
    ...task,
    payment: sanitizePayment(task.payment),
  };
}

function calculateEarningsByPerson() {
  const totals = FAMILY.reduce((acc, member) => {
    acc[member.name] = 0;
    return acc;
  }, {});

  tasks.forEach((task) => {
    if (task.status === "Done") {
      totals[task.person] += task.payment ?? 0;
    }
  });

  return totals;
}

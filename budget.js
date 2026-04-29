//SELECT ELEMENTS
const balanceEl = document.querySelector(".balance .value");
const incomeTotalEl = document.querySelector(".income-total");
const outcomeTotalEl = document.querySelector(".outcome-total");
const incomeEl = document.querySelector("#income");
const expenseEl = document.querySelector("#expense");
const allEl = document.querySelector("#all");
const incomeList = document.querySelector("#income .list");
const expenseList = document.querySelector("#expense .list");
const allList = document.querySelector("#all .list");

//SELECT BUTTONS
const expenseBtn = document.querySelector(".first-tab");
const incomeBtn = document.querySelector(".second-tab");
const allBtn = document.querySelector(".third-tab");

//INPUT BTS
const addExpense = document.querySelector(".add-expense");
const expenseTitle = document.getElementById("expense-title-input");
const expenseAmount = document.getElementById("expense-amount-input");

const addIncome = document.querySelector(".add-income");
const incomeTitle = document.getElementById("income-title-input");
const incomeAmount = document.getElementById("income-amount-input");

//VARIABLES
let ENTRY_LIST;
let balance = 0,
  income = 0,
  outcome = 0;

const DELETE = "delete",
  EDIT = "edit";

const AMOUNT_ERROR = "Please enter a valid positive amount.";

// INIT
ENTRY_LIST = JSON.parse(localStorage.getItem("entry_list")) || [];

/* istanbul ignore next */
updateUI();

//EVENT LISTENERS
/* istanbul ignore next */
expenseBtn.addEventListener("click", function () {
  show(expenseEl);
  hide([incomeEl, allEl]);
  active(expenseBtn);
  inactive([incomeBtn, allBtn]);
});

/* istanbul ignore next */
incomeBtn.addEventListener("click", function () {
  show(incomeEl);
  hide([expenseEl, allEl]);
  active(incomeBtn);
  inactive([expenseBtn, allBtn]);
});

/* istanbul ignore next */
allBtn.addEventListener("click", function () {
  show(allEl);
  hide([incomeEl, expenseEl]);
  active(allBtn);
  inactive([incomeBtn, expenseBtn]);
});

/* istanbul ignore next */
addExpense.addEventListener("click", function () {
  if (!expenseTitle.value) return;

  const amount = getPositiveAmount(expenseAmount);
  if (amount === null) return;

  let expense = {
    type: "expense",
    title: expenseTitle.value,
    amount: amount,
  };

  ENTRY_LIST.push(expense);
  updateUI();
  clearInput([expenseTitle, expenseAmount]);
});

/* istanbul ignore next */
addIncome.addEventListener("click", function () {
  if (!incomeTitle.value) return;

  const amount = getPositiveAmount(incomeAmount);
  if (amount === null) return;

  let income = {
    type: "income",
    title: incomeTitle.value,
    amount: amount,
  };

  ENTRY_LIST.push(income);
  updateUI();
  clearInput([incomeTitle, incomeAmount]);
});

/* istanbul ignore next */
incomeList.addEventListener("click", deleteOrEdit);
/* istanbul ignore next */
expenseList.addEventListener("click", deleteOrEdit);
/* istanbul ignore next */
allList.addEventListener("click", deleteOrEdit);


// FUNCTIONS
/* istanbul ignore next */
function deleteOrEdit(event) {
  const targetBtn = event.target;
  const entry = targetBtn.parentNode;

  if (targetBtn.id == EDIT) {
    editEntry(entry);
  } else if (targetBtn.id == DELETE) {
    deleteEntry(entry);
  }
}

/* istanbul ignore next */
function deleteEntry(entry) {
  ENTRY_LIST.splice(entry.id, 1);
  updateUI();
}

/* istanbul ignore next */
function editEntry(entry) {
  const ENTRY = ENTRY_LIST[entry.id];

  if (ENTRY.type == "income") {
    incomeTitle.value = ENTRY.title;
    incomeAmount.value = ENTRY.amount;
  } else {
    expenseTitle.value = ENTRY.title;
    expenseAmount.value = ENTRY.amount;
  }

  deleteEntry(entry);
}

/* istanbul ignore next */
function updateUI() {
  income = calculateTotal("income", ENTRY_LIST);
  outcome = calculateTotal("expense", ENTRY_LIST);
  balance = Math.abs(calculateBalance(income, outcome));

  let sign = income >= outcome ? "$" : "-$";

  balanceEl.innerHTML = `<small>${sign}</small>${balance}`;
  outcomeTotalEl.innerHTML = `<small>$</small>${outcome}`;
  incomeTotalEl.innerHTML = `<small>$</small>${income}`;

  clearElement([expenseList, incomeList, allList]);

  ENTRY_LIST.forEach((entry, index) => {
    if (entry.type == "expense") {
      showEntry(expenseList, entry.type, entry.title, entry.amount, index);
    } else {
      showEntry(incomeList, entry.type, entry.title, entry.amount, index);
    }
    showEntry(allList, entry.type, entry.title, entry.amount, index);
  });

  updateChart(income, outcome);
  localStorage.setItem("entry_list", JSON.stringify(ENTRY_LIST));
}

/* istanbul ignore next */
function showEntry(list, type, title, amount, id) {
  const li = document.createElement("li");
  li.id = id;
  li.className = type;

  const entryDiv = document.createElement("div");
  entryDiv.className = "entry";
  entryDiv.textContent = `${title} : $${amount}`;

  const editDiv = document.createElement("div");
  editDiv.id = "edit";

  const deleteDiv = document.createElement("div");
  deleteDiv.id = "delete";

  li.appendChild(entryDiv);
  li.appendChild(editDiv);
  li.appendChild(deleteDiv);

  list.insertBefore(li, list.firstChild);
}


// ===== LOGIC (YOU TEST THESE) =====

function calculateTotal(type, list) {
  let sum = 0;
  list.forEach((entry) => {
    if (entry.type == type) {
      sum += entry.amount;
    }
  });
  return sum;
}

function calculateBalance(income, outcome) {
  return income - outcome;
}

function getPositiveAmount(input) {
  const amount = Number(input.value);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert(AMOUNT_ERROR);
    input.value = "";
    input.focus();
    return null;
  }

  return amount;
}


// ===== SMALL HELPERS =====

function clearElement(elements) {
  elements.forEach((element) => {
    element.innerHTML = "";
  });
}

function clearInput(inputs) {
  inputs.forEach((input) => {
    input.value = "";
  });
}

function show(element) {
  element.classList.remove("hide");
}

function hide(elements) {
  elements.forEach((element) => {
    element.classList.add("hide");
  });
}

function active(element) {
  element.classList.add("focus");
}

function inactive(elements) {
  elements.forEach((element) => {
    element.classList.remove("focus");
  });
}


// EXPORT FOR TEST
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    calculateTotal, 
    calculateBalance,
    getPositiveAmount,
    show,
    hide,
    active,
    inactive,
    clearInput,
    clearElement
  };
}

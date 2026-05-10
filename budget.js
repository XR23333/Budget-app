// =====================
// SELECT DOM ELEMENTS
// =====================
const balanceEl = document.querySelector(".balance .value");
const incomeTotalEl = document.querySelector(".income-total");
const outcomeTotalEl = document.querySelector(".outcome-total");

const incomeEl = document.querySelector("#income");
const expenseEl = document.querySelector("#expense");
const allEl = document.querySelector("#all");

const incomeList = document.querySelector("#income .list");
const expenseList = document.querySelector("#expense .list");
const allList = document.querySelector("#all .list");

// =====================
// SELECT BUTTONS
// =====================
const expenseBtn = document.querySelector(".first-tab");
const incomeBtn = document.querySelector(".second-tab");
const allBtn = document.querySelector(".third-tab");

// =====================
// INPUT ELEMENTS
// =====================
const addExpense = document.querySelector(".add-expense");
const expenseTitle = document.getElementById("expense-title-input");
const expenseAmount = document.getElementById("expense-amount-input");

const addIncome = document.querySelector(".add-income");
const incomeTitle = document.getElementById("income-title-input");
const incomeAmount = document.getElementById("income-amount-input");

// =====================
// STATE VARIABLES
// =====================
let ENTRY_LIST;
let balance = 0;
let income = 0;
let outcome = 0;

// Action identifiers
const DELETE = "delete";
const EDIT = "edit";

// Validation message
const AMOUNT_ERROR = "Please enter a valid positive amount.";

// =====================
// LOCAL STORAGE HANDLING
// =====================

// Load entries safely from localStorage
function loadEntries() {
  try {
    const savedData = localStorage.getItem("entry_list");

    if (!savedData) return [];

    const parsedData = JSON.parse(savedData);

    if (!Array.isArray(parsedData)) {
      throw new Error("Invalid entry list format");
    }

    return parsedData;
  } catch (error) {
    console.error("Failed to load entries:", error);

    // Reset corrupted data
    localStorage.removeItem("entry_list");
    alert("Saved data was corrupted and has been reset.");

    return [];
  }
}

// Save entries safely to localStorage
function saveEntries() {
  try {
    localStorage.setItem("entry_list", JSON.stringify(ENTRY_LIST));
  } catch (error) {
    console.error("Failed to save entries:", error);
    alert("Unable to save budget data.");
  }
}

// Initialize data
ENTRY_LIST = loadEntries();
updateUI();

// =====================
// EVENT LISTENERS
// =====================

// Tab switching
expenseBtn.addEventListener("click", () => {
  show(expenseEl);
  hide([incomeEl, allEl]);
  active(expenseBtn);
  inactive([incomeBtn, allBtn]);
});

incomeBtn.addEventListener("click", () => {
  show(incomeEl);
  hide([expenseEl, allEl]);
  active(incomeBtn);
  inactive([expenseBtn, allBtn]);
});

allBtn.addEventListener("click", () => {
  show(allEl);
  hide([incomeEl, expenseEl]);
  active(allBtn);
  inactive([incomeBtn, expenseBtn]);
});

// Add expense
addExpense.addEventListener("click", () => {
  if (!expenseTitle.value) return;

  const amount = getPositiveAmount(expenseAmount);
  if (amount === null) return;

  const expense = {
    type: "expense",
    title: expenseTitle.value,
    amount: amount,
  };

  ENTRY_LIST.push(expense);
  updateUI();
  clearInput([expenseTitle, expenseAmount]);
});

// Add income
addIncome.addEventListener("click", () => {
  if (!incomeTitle.value) return;

  const amount = getPositiveAmount(incomeAmount);
  if (amount === null) return;

  const incomeEntry = {
    type: "income",
    title: incomeTitle.value,
    amount: amount,
  };

  ENTRY_LIST.push(incomeEntry);
  updateUI();
  clearInput([incomeTitle, incomeAmount]);
});

// Handle delete/edit clicks
incomeList.addEventListener("click", deleteOrEdit);
expenseList.addEventListener("click", deleteOrEdit);
allList.addEventListener("click", deleteOrEdit);

// =====================
// CORE FUNCTIONS
// =====================

// Decide whether to delete or edit an entry
function deleteOrEdit(event) {
  const targetBtn = event.target;
  const entry = targetBtn.parentNode;

  if (targetBtn.id === EDIT) {
    editEntry(entry);
  } else if (targetBtn.id === DELETE) {
    deleteEntry(entry);
  }
}

// Remove entry from list
function deleteEntry(entry) {
  ENTRY_LIST.splice(entry.id, 1);
  updateUI();
}

// Load entry data into inputs for editing
function editEntry(entry) {
  const ENTRY = ENTRY_LIST[entry.id];

  if (ENTRY.type === "income") {
    incomeTitle.value = ENTRY.title;
    incomeAmount.value = ENTRY.amount;
  } else {
    expenseTitle.value = ENTRY.title;
    expenseAmount.value = ENTRY.amount;
  }

  deleteEntry(entry);
}

// Update UI and recalculate values
function updateUI() {
  income = calculateTotal("income", ENTRY_LIST);
  outcome = calculateTotal("expense", ENTRY_LIST);
  balance = Math.abs(calculateBalance(income, outcome));

  const sign = income >= outcome ? "$" : "-$";

  balanceEl.innerHTML = `<small>${sign}</small>${balance}`;
  outcomeTotalEl.innerHTML = `<small>$</small>${outcome}`;
  incomeTotalEl.innerHTML = `<small>$</small>${income}`;

  clearElement([expenseList, incomeList, allList]);

  ENTRY_LIST.forEach((entry, index) => {
    if (entry.type === "expense") {
      showEntry(expenseList, entry.type, entry.title, entry.amount, index);
    } else {
      showEntry(incomeList, entry.type, entry.title, entry.amount, index);
    }

    showEntry(allList, entry.type, entry.title, entry.amount, index);
  });

  updateChart(income, outcome);

  // Persist data
  saveEntries();
}

// Render a single entry
function showEntry(list, type, title, amount, id) {
  const li = document.createElement("li");
  li.id = id;
  li.className = type;

  const entryDiv = document.createElement("div");
  entryDiv.className = "entry";
  entryDiv.textContent = `${title} : $${amount}`;

  const editDiv = document.createElement("div");
  editDiv.id = EDIT;

  const deleteDiv = document.createElement("div");
  deleteDiv.id = DELETE;

  li.appendChild(entryDiv);
  li.appendChild(editDiv);
  li.appendChild(deleteDiv);

  list.insertBefore(li, list.firstChild);
}

// =====================
// BUSINESS LOGIC
// =====================

// Calculate total income or expense
function calculateTotal(type, list) {
  let sum = 0;

  list.forEach((entry) => {
    if (entry.type === type) {
      sum += entry.amount;
    }
  });

  return sum;
}

// Calculate balance
function calculateBalance(income, outcome) {
  return income - outcome;
}

// Validate positive numeric input
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

// =====================
// HELPER FUNCTIONS
// =====================

// Clear list elements
function clearElement(elements) {
  elements.forEach((element) => {
    element.innerHTML = "";
  });
}

// Clear input fields
function clearInput(inputs) {
  inputs.forEach((input) => {
    input.value = "";
  });
}

// Show element
function show(element) {
  element.classList.remove("hide");
}

// Hide elements
function hide(elements) {
  elements.forEach((element) => {
    element.classList.add("hide");
  });
}

// Activate tab
function active(element) {
  element.classList.add("focus");
}

// Deactivate tabs
function inactive(elements) {
  elements.forEach((element) => {
    element.classList.remove("focus");
  });
}

// =====================
// EXPORT FOR TESTING
// =====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadEntries,
    saveEntries,
    deleteOrEdit,
    deleteEntry,
    editEntry,
    updateUI,
    showEntry,
    calculateTotal,
    calculateBalance,
    getPositiveAmount,
    clearElement,
    clearInput,
    show,
    hide,
    active,
    inactive
  };
}
// ==================== COOKIE BANNER LOGIC ====================
const cookieBanner = document.getElementById('cookie-banner');
const acceptCookiesBtn = document.getElementById('accept-cookies');

if (cookieBanner && acceptCookiesBtn) {
    
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');

    if (!cookiesAccepted) {
        
        setTimeout(() => {
            cookieBanner.classList.remove('hide');
        }, 1000);
    }

    
    acceptCookiesBtn.addEventListener('click', () => {
        
        localStorage.setItem('cookiesAccepted', 'true');
        
        cookieBanner.classList.add('hide');
    });
}
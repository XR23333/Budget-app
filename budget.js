// =====================
// INTERNATIONALIZATION
// =====================
const translations = {
  en: {
    balance: "Balance",
    income: "Income",
    outcome: "Outcome",
    dashboard: "Dashboard",
    expenses: "Expenses",
    all: "All",
    titlePlaceholder: "title",
    cookieText:
      "🍪 We use cookies and local storage to save your budget data securely on your device.",
    gotIt: "Got it!",
    amountError: "Please enter a valid positive amount.",
    corruptedData: "Saved data was corrupted and has been reset.",
    saveError: "Unable to save budget data.",
  },
  zh: {
    balance: "余额",
    income: "收入",
    outcome: "支出",
    dashboard: "仪表盘",
    expenses: "支出",
    all: "全部",
    titlePlaceholder: "标题",
    cookieText:
      "🍪 我们使用 Cookie 和本地存储，将你的预算数据安全保存在本设备上。",
    gotIt: "知道了！",
    amountError: "请输入有效的正数金额。",
    corruptedData: "保存的数据已损坏，系统已重置。",
    saveError: "无法保存预算数据。",
  },
};

let currentLanguage = localStorage.getItem("language") || "en";

// =====================
// CURRENCY
// =====================
// 固定汇率：$1 = ¥7
const EXCHANGE_RATE = 7;

const CURRENCIES = {
  USD: {
    code: "USD",
    symbol: "$",
    rate: 1,
  },
  CNY: {
    code: "CNY",
    symbol: "¥",
    rate: EXCHANGE_RATE,
  },
};

let currentCurrency = localStorage.getItem("currency") || "USD";

if (!CURRENCIES[currentCurrency]) {
  currentCurrency = "USD";
}

function t(key) {
  return translations[currentLanguage][key] || translations.en[key] || key;
}

function currencySymbol() {
  return CURRENCIES[currentCurrency].symbol;
}

function getCurrencyRate() {
  return CURRENCIES[currentCurrency].rate;
}

// 数据内部统一按 USD 保存。
// 如果当前是人民币，显示时 amount * 7。
function toDisplayAmount(amount) {
  return Number((Number(amount) * getCurrencyRate()).toFixed(2));
}

// 用户输入的是当前货币。
// 如果当前是人民币，保存时 amount / 7。
function toBaseAmount(amount) {
  return Number((Number(amount) / getCurrencyRate()).toFixed(2));
}

function formatAmount(amount) {
  const displayAmount = toDisplayAmount(amount);

  return Number.isInteger(displayAmount)
    ? String(displayAmount)
    : displayAmount.toFixed(2);
}

function updateAmountPlaceholders() {
  const symbol = currencySymbol();

  if (expenseAmount) {
    expenseAmount.placeholder = `${symbol}0`;
  }

  if (incomeAmount) {
    incomeAmount.placeholder = `${symbol}0`;
  }
}

function applyLanguage(lang) {
  currentLanguage = translations[lang] ? lang : "en";
  localStorage.setItem("language", currentLanguage);
  document.documentElement.lang = currentLanguage;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    element.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    element.placeholder = t(key);
  });

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle(
      "active-lang",
      button.dataset.lang === currentLanguage
    );
  });


  updateAmountPlaceholders();

  if (Array.isArray(ENTRY_LIST)) {
    updateUI();
  }
}

function applyCurrency(currency) {
  currentCurrency = CURRENCIES[currency] ? currency : "USD";
  localStorage.setItem("currency", currentCurrency);

  document.querySelectorAll(".currency-btn").forEach((button) => {
    button.classList.toggle(
      "active-currency",
      button.dataset.currency === currentCurrency
    );
  });

  updateAmountPlaceholders();

  if (Array.isArray(ENTRY_LIST)) {
    updateUI();
  }
}

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

let editIndex = null;

// Action identifiers
const DELETE = "delete";
const EDIT = "edit";

// Validation message key
const AMOUNT_ERROR = "amountError";

// =====================
// LOCAL STORAGE HANDLING
// =====================
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
    localStorage.removeItem("entry_list");
    alert(t("corruptedData"));
    return [];
  }
}

function saveEntries() {
  try {
    localStorage.setItem("entry_list", JSON.stringify(ENTRY_LIST));
  } catch (error) {
    console.error("Failed to save entries:", error);
    alert(t("saveError"));
  }
}

// Initialize data
ENTRY_LIST = loadEntries();
applyLanguage(currentLanguage);
applyCurrency(currentCurrency);
updateAmountPlaceholders();
updateUI();

// =====================
// EVENT LISTENERS
// =====================
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

document.querySelectorAll(".lang-btn").forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
  });
});

document.querySelectorAll(".currency-btn").forEach((button) => {
  button.addEventListener("click", () => {
    applyCurrency(button.dataset.currency);
  });
});

addExpense.addEventListener("click", () => {
  if (!expenseTitle.value) return;

  const amount = getPositiveAmount(expenseAmount);
  if (amount === null) return;

  const entryData = {
    type: "expense",
    title: expenseTitle.value,
    amount: toBaseAmount(amount),
  };

  if (editIndex !== null) {
    ENTRY_LIST[editIndex] = entryData;
    editIndex = null;
  } else {
    ENTRY_LIST.push(entryData);
  }

  updateUI();
  clearInput([expenseTitle, expenseAmount]);
});

addIncome.addEventListener("click", () => {
  if (!incomeTitle.value) return;

  const amount = getPositiveAmount(incomeAmount);
  if (amount === null) return;

  const entryData = {
    type: "income",
    title: incomeTitle.value,
    amount: toBaseAmount(amount),
  };

  if (editIndex !== null) {
    ENTRY_LIST[editIndex] = entryData;
    editIndex = null;
  } else {
    ENTRY_LIST.push(entryData);
  }

  updateUI();
  clearInput([incomeTitle, incomeAmount]);
});

incomeList.addEventListener("click", deleteOrEdit);
expenseList.addEventListener("click", deleteOrEdit);
allList.addEventListener("click", deleteOrEdit);

// =====================
// CORE FUNCTIONS
// =====================
function deleteOrEdit(event) {
  if (!event.target || typeof event.target.closest !== "function") return;

  const targetBtn = event.target.closest("#edit, #delete");

  if (!targetBtn) return;

  const entry = targetBtn.closest("li");

  if (targetBtn.id === EDIT) {
    editEntry(entry);
  } else if (targetBtn.id === DELETE) {
    deleteEntry(entry);
  }
}

function deleteEntry(entry) {
  ENTRY_LIST.splice(Number(entry.id), 1);

  if (editIndex === Number(entry.id)) {
    editIndex = null;
  }

  updateUI();
}

function editEntry(entry) {
  editIndex = Number(entry.id);
  const ENTRY = ENTRY_LIST[editIndex];

  if (!ENTRY) return;

  if (ENTRY.type === "income") {
    incomeTitle.value = ENTRY.title;

    // 编辑时，输入框显示当前选择货币下的金额
    incomeAmount.value = formatAmount(ENTRY.amount);

    show(incomeEl);
    hide([expenseEl, allEl]);
    active(incomeBtn);
    inactive([expenseBtn, allBtn]);
  } else {
    expenseTitle.value = ENTRY.title;

    // 编辑时，输入框显示当前选择货币下的金额
    expenseAmount.value = formatAmount(ENTRY.amount);

    show(expenseEl);
    hide([incomeEl, allEl]);
    active(expenseBtn);
    inactive([incomeBtn, allBtn]);
  }

  updateAmountPlaceholders();
}

function updateUI() {
  income = calculateTotal("income", ENTRY_LIST);
  outcome = calculateTotal("expense", ENTRY_LIST);
  balance = Math.abs(calculateBalance(income, outcome));

  const symbol = currencySymbol();
  const sign = income >= outcome ? symbol : `-${symbol}`;

  balanceEl.innerHTML = `<small>${sign}</small>${formatAmount(balance)}`;
  outcomeTotalEl.innerHTML = `<small>${symbol}</small>${formatAmount(outcome)}`;
  incomeTotalEl.innerHTML = `<small>${symbol}</small>${formatAmount(income)}`;

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
  saveEntries();
}

function showEntry(list, type, title, amount, id) {
  const li = document.createElement("li");
  li.id = id;
  li.className = type;

  const entryDiv = document.createElement("div");
  entryDiv.className = "entry";
  entryDiv.textContent = `${title} : ${currencySymbol()}${formatAmount(amount)}`;

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
function calculateTotal(type, list) {
  let sum = 0;

  list.forEach((entry) => {
    if (entry.type === type) {
      sum += Number(entry.amount);
    }
  });

  return Number(sum.toFixed(2));
}

function calculateBalance(income, outcome) {
  return Number((income - outcome).toFixed(2));
}

function getPositiveAmount(input) {
  const rawValue = String(input.value).replace(currencySymbol(), "").trim();
  const amount = Number(rawValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert(t(AMOUNT_ERROR));
    input.value = "";
    input.focus();
    return null;
  }

  return amount;
}

// =====================
// HELPER FUNCTIONS
// =====================
function clearElement(elements) {
  elements.forEach((element) => {
    element.innerHTML = "";
  });
}

function clearInput(inputs) {
  inputs.forEach((input) => {
    input.value = "";
  });

  updateAmountPlaceholders();
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

// ====================
// COOKIE BANNER LOGIC
// ====================
const cookieBanner = document.getElementById("cookie-banner");
const acceptCookiesBtn = document.getElementById("accept-cookies");

if (cookieBanner && acceptCookiesBtn) {
  const cookiesAccepted = localStorage.getItem("cookiesAccepted");

  if (!cookiesAccepted) {
    setTimeout(() => {
      cookieBanner.classList.remove("hide");
    }, 1000);
  }

  acceptCookiesBtn.addEventListener("click", () => {
    localStorage.setItem("cookiesAccepted", "true");
    cookieBanner.classList.add("hide");
  });
}

// =====================
// EXPORT FOR TESTING
// =====================
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    translations,
    t,
    applyLanguage,
    applyCurrency,
    currencySymbol,
    getCurrencyRate,
    toDisplayAmount,
    toBaseAmount,
    formatAmount,
    updateAmountPlaceholders,
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
    inactive,
  };
}

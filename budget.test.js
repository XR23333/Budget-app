const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

const cookieHtml = `
  <div id="cookie-banner" class="hide">Cookie Banner</div>
  <button id="accept-cookies">Accept</button>
`;

function setupDOM() {
  document.body.innerHTML = html.toString() + cookieHtml;
  global.updateChart = jest.fn();
  global.alert = jest.fn();
  global.console.error = jest.fn();
}

function loadBudgetModule() {
  jest.resetModules();
  setupDOM();
  return require('./budget.js');
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('business logic', () => {
  test('calculateTotal should sum only matching entry types and round to two decimals', () => {
    const budget = loadBudgetModule();
    const entries = [
      { type: 'income', title: 'Salary', amount: 100.111 },
      { type: 'income', title: 'Bonus', amount: 50.225 },
      { type: 'expense', title: 'Lunch', amount: 20 },
    ];

    expect(budget.calculateTotal('income', entries)).toBe(150.34);
    expect(budget.calculateTotal('expense', entries)).toBe(20);
    expect(budget.calculateTotal('saving', entries)).toBe(0);
  });

  test('calculateTotal should return 0 for an empty list', () => {
    const budget = loadBudgetModule();

    expect(budget.calculateTotal('income', [])).toBe(0);
  });

  test('calculateBalance should return income minus outcome rounded to two decimals', () => {
    const budget = loadBudgetModule();

    expect(budget.calculateBalance(500, 125.337)).toBe(374.66);
    expect(budget.calculateBalance(100, 300)).toBe(-200);
    expect(budget.calculateBalance(0, 0)).toBe(0);
  });
});

describe('currency helpers', () => {
  test('default currency should be USD', () => {
    const budget = loadBudgetModule();

    expect(budget.currencySymbol()).toBe('$');
    expect(budget.getCurrencyRate()).toBe(1);
    expect(budget.toDisplayAmount(10)).toBe(10);
    expect(budget.toBaseAmount(10)).toBe(10);
    expect(budget.formatAmount(10.5)).toBe('10.50');
  });

  test('applyCurrency should switch to CNY and convert display/base amounts', () => {
    const budget = loadBudgetModule();

    budget.applyCurrency('CNY');

    expect(localStorage.getItem('currency')).toBe('CNY');
    expect(budget.currencySymbol()).toBe('¥');
    expect(budget.getCurrencyRate()).toBe(7);
    expect(budget.toDisplayAmount(10)).toBe(70);
    expect(budget.toBaseAmount(70)).toBe(10);
    expect(budget.formatAmount(10.5)).toBe('73.50');
  });

  test('applyCurrency should fall back to USD for invalid currency code', () => {
    const budget = loadBudgetModule();

    budget.applyCurrency('EUR');

    expect(budget.currencySymbol()).toBe('$');
    expect(localStorage.getItem('currency')).toBe('USD');
  });

  test('invalid saved currency should fall back to USD on module load', () => {
    localStorage.setItem('currency', 'EUR');

    const budget = loadBudgetModule();

    expect(budget.currencySymbol()).toBe('$');
    expect(budget.getCurrencyRate()).toBe(1);
  });

  test('amount placeholders should use the current currency symbol', () => {
    const budget = loadBudgetModule();
    const incomeAmount = document.getElementById('income-amount-input');
    const expenseAmount = document.getElementById('expense-amount-input');

    budget.applyCurrency('CNY');

    expect(incomeAmount.placeholder).toBe('¥0');
    expect(expenseAmount.placeholder).toBe('¥0');
  });

  test('formatAmount should return integer values without decimal places', () => {
    const budget = loadBudgetModule();

    expect(budget.formatAmount(100)).toBe('100');
  });
});

describe('language helpers', () => {
  test('t should return translated text for current language', () => {
    const budget = loadBudgetModule();

    expect(budget.t('balance')).toBe('Balance');

    budget.applyLanguage('zh');

    expect(localStorage.getItem('language')).toBe('zh');
    expect(document.documentElement.lang).toBe('zh');
    expect(budget.t('balance')).toBe('余额');
    expect(budget.t('amountError')).toBe('请输入有效的正数金额。');
  });

  test('applyLanguage should fall back to English for invalid language', () => {
    const budget = loadBudgetModule();

    budget.applyLanguage('fr');

    expect(localStorage.getItem('language')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(budget.t('dashboard')).toBe('Dashboard');
  });

  test('t should return key itself when translation does not exist', () => {
    const budget = loadBudgetModule();

    expect(budget.t('unknownKey')).toBe('unknownKey');
  });

  test('language buttons should update active-lang class', () => {
    const budget = loadBudgetModule();
    const zhButton = document.querySelector('.lang-btn[data-lang="zh"]');
    const enButton = document.querySelector('.lang-btn[data-lang="en"]');

    if (!zhButton || !enButton) {
      return;
    }

    budget.applyLanguage('zh');

    expect(zhButton.classList.contains('active-lang')).toBe(true);
    expect(enButton.classList.contains('active-lang')).toBe(false);
  });
});

describe('amount validation', () => {
  test('getPositiveAmount should accept positive numbers with current currency symbol', () => {
    const budget = loadBudgetModule();
    const input = document.createElement('input');

    input.value = '$120.50';

    expect(budget.getPositiveAmount(input)).toBe(120.5);
    expect(global.alert).not.toHaveBeenCalled();
  });

  test('getPositiveAmount should accept CNY input with currency symbol', () => {
    const budget = loadBudgetModule();
    const input = document.createElement('input');

    budget.applyCurrency('CNY');
    input.value = '¥70';

    expect(budget.getPositiveAmount(input)).toBe(70);
  });

  test('getPositiveAmount should reject zero, negative, and non-numeric values', () => {
    const budget = loadBudgetModule();

    ['0', '-1', 'abc'].forEach((value) => {
      const input = document.createElement('input');
      input.value = value;
      input.focus = jest.fn();

      expect(budget.getPositiveAmount(input)).toBeNull();
      expect(input.value).toBe('');
      expect(input.focus).toHaveBeenCalled();
    });

    expect(global.alert).toHaveBeenCalledTimes(3);
  });

  test('getPositiveAmount should reject Infinity and NaN values', () => {
    const budget = loadBudgetModule();

    ['Infinity', 'NaN'].forEach((value) => {
      const input = document.createElement('input');
      input.value = value;
      input.focus = jest.fn();

      expect(budget.getPositiveAmount(input)).toBeNull();
      expect(input.value).toBe('');
      expect(input.focus).toHaveBeenCalled();
    });
  });

  test('validation alert should follow selected language', () => {
    const budget = loadBudgetModule();
    const input = document.createElement('input');
    input.value = 'bad';
    input.focus = jest.fn();

    budget.applyLanguage('zh');
    budget.getPositiveAmount(input);

    expect(global.alert).toHaveBeenCalledWith('请输入有效的正数金额。');
  });
});

describe('UI helper functions', () => {
  test('show and hide should toggle hide class', () => {
    const budget = loadBudgetModule();
    const one = document.createElement('div');
    const two = document.createElement('div');

    budget.hide([one, two]);
    expect(one.classList.contains('hide')).toBe(true);
    expect(two.classList.contains('hide')).toBe(true);

    budget.show(one);
    expect(one.classList.contains('hide')).toBe(false);
  });

  test('active and inactive should toggle focus class', () => {
    const budget = loadBudgetModule();
    const one = document.createElement('button');
    const two = document.createElement('button');

    budget.active(one);
    expect(one.classList.contains('focus')).toBe(true);

    budget.active(two);
    budget.inactive([one, two]);
    expect(one.classList.contains('focus')).toBe(false);
    expect(two.classList.contains('focus')).toBe(false);
  });

  test('clearElement and clearInput should reset DOM content and values', () => {
    const budget = loadBudgetModule();
    const div = document.createElement('div');
    const input = document.createElement('input');

    div.innerHTML = '<span>hello</span>';
    input.value = '123';

    budget.clearElement([div]);
    budget.clearInput([input]);

    expect(div.innerHTML).toBe('');
    expect(input.value).toBe('');
  });
});

describe('rendering and user interactions', () => {
  test('adding income should update income list, all list, totals, and localStorage', () => {
    loadBudgetModule();

    document.getElementById('income-title-input').value = 'Salary';
    document.getElementById('income-amount-input').value = '1000';
    document.querySelector('.add-income').click();

    expect(document.querySelector('#income .list').textContent).toContain('Salary : $1000');
    expect(document.querySelector('#all .list').textContent).toContain('Salary : $1000');
    expect(document.querySelector('.income-total').innerHTML).toContain('1000');
    expect(JSON.parse(localStorage.getItem('entry_list'))).toEqual([
      { type: 'income', title: 'Salary', amount: 1000 },
    ]);
  });

  test('adding expense should update expense list, all list, and outcome total', () => {
    loadBudgetModule();

    document.getElementById('expense-title-input').value = 'Lunch';
    document.getElementById('expense-amount-input').value = '50';
    document.querySelector('.add-expense').click();

    expect(document.querySelector('#expense .list').textContent).toContain('Lunch : $50');
    expect(document.querySelector('#all .list').textContent).toContain('Lunch : $50');
    expect(document.querySelector('.outcome-total').innerHTML).toContain('50');
  });

  test('balance should display negative sign when expenses are greater than income', () => {
    loadBudgetModule();

    document.getElementById('expense-title-input').value = 'Rent';
    document.getElementById('expense-amount-input').value = '500';
    document.querySelector('.add-expense').click();

    expect(document.querySelector('.balance .value').innerHTML).toContain('-$');
    expect(document.querySelector('.balance .value').innerHTML).toContain('500');
  });

  test('empty income title should not add a new income entry', () => {
    loadBudgetModule();

    document.getElementById('income-title-input').value = '';
    document.getElementById('income-amount-input').value = '100';
    document.querySelector('.add-income').click();

    expect(document.querySelector('#income .list').children.length).toBe(0);
    expect(JSON.parse(localStorage.getItem('entry_list'))).toEqual([]);
  });

  test('empty expense title should not add a new expense entry', () => {
    loadBudgetModule();

    document.getElementById('expense-title-input').value = '';
    document.getElementById('expense-amount-input').value = '100';
    document.querySelector('.add-expense').click();

    expect(document.querySelector('#expense .list').children.length).toBe(0);
    expect(JSON.parse(localStorage.getItem('entry_list'))).toEqual([]);
  });

  test('invalid income amount should not add a new income entry', () => {
    loadBudgetModule();

    document.getElementById('income-title-input').value = 'Invalid Income';
    document.getElementById('income-amount-input').value = '-100';
    document.querySelector('.add-income').click();

    expect(document.querySelector('#income .list').children.length).toBe(0);
    expect(JSON.parse(localStorage.getItem('entry_list'))).toEqual([]);
    expect(global.alert).toHaveBeenCalled();
  });

  test('invalid expense amount should not add a new expense entry', () => {
    loadBudgetModule();

    document.getElementById('expense-title-input').value = 'Invalid Expense';
    document.getElementById('expense-amount-input').value = '0';
    document.querySelector('.add-expense').click();

    expect(document.querySelector('#expense .list').children.length).toBe(0);
    expect(JSON.parse(localStorage.getItem('entry_list'))).toEqual([]);
    expect(global.alert).toHaveBeenCalled();
  });

  test('expense button should switch to expense panel', () => {
    loadBudgetModule();

    document.querySelector('.first-tab').click();

    expect(document.querySelector('#expense').classList.contains('hide')).toBe(false);
    expect(document.querySelector('#income').classList.contains('hide')).toBe(true);
    expect(document.querySelector('#all').classList.contains('hide')).toBe(true);
    expect(document.querySelector('.first-tab').classList.contains('focus')).toBe(true);
  });

  test('tab buttons should switch visible panel and focused tab', () => {
    loadBudgetModule();

    document.querySelector('.second-tab').click();
    expect(document.querySelector('#income').classList.contains('hide')).toBe(false);
    expect(document.querySelector('.second-tab').classList.contains('focus')).toBe(true);

    document.querySelector('.third-tab').click();
    expect(document.querySelector('#all').classList.contains('hide')).toBe(false);
    expect(document.querySelector('.third-tab').classList.contains('focus')).toBe(true);
  });

  test('language button click should switch language', () => {
    loadBudgetModule();

    const zhButton = document.querySelector('.lang-btn[data-lang="zh"]');

    if (!zhButton) {
      return;
    }

    zhButton.click();

    expect(localStorage.getItem('language')).toBe('zh');
    expect(document.documentElement.lang).toBe('zh');
  });

  test('currency button click should switch currency', () => {
    loadBudgetModule();

    const cnyButton = document.querySelector('.currency-btn[data-currency="CNY"]');

    if (!cnyButton) {
      return;
    }

    cnyButton.click();

    expect(localStorage.getItem('currency')).toBe('CNY');
  });

  test('deleteOrEdit should edit an income entry through a real clicked edit button', () => {
    loadBudgetModule();

    document.getElementById('income-title-input').value = 'Freelance';
    document.getElementById('income-amount-input').value = '300';
    document.querySelector('.add-income').click();

    document.querySelector('#income .list li #edit').click();

    expect(document.getElementById('income-title-input').value).toBe('Freelance');
    expect(document.getElementById('income-amount-input').value).toBe('300');
    expect(document.querySelector('#income').classList.contains('hide')).toBe(false);
  });

  test('deleteOrEdit should edit an expense entry through a real clicked edit button', () => {
    loadBudgetModule();

    document.getElementById('expense-title-input').value = 'Coffee';
    document.getElementById('expense-amount-input').value = '6';
    document.querySelector('.add-expense').click();

    document.querySelector('#expense .list li #edit').click();

    expect(document.getElementById('expense-title-input').value).toBe('Coffee');
    expect(document.getElementById('expense-amount-input').value).toBe('6');
    expect(document.querySelector('#expense').classList.contains('hide')).toBe(false);
  });

  test('deleteOrEdit should route to deleteEntry when target id is delete', () => {
    const budget = loadBudgetModule();

    document.getElementById('income-title-input').value = 'Delete Route';
    document.getElementById('income-amount-input').value = '100';
    document.querySelector('.add-income').click();

    const deleteButton = document.querySelector('#income .list li #delete');

    budget.deleteOrEdit({
      target: deleteButton,
    });

    expect(JSON.parse(localStorage.getItem('entry_list'))).toEqual([]);
    expect(document.querySelector('#income .list').children.length).toBe(0);
  });

  test('deleteOrEdit should route to editEntry when target id is edit', () => {
    const budget = loadBudgetModule();

    document.getElementById('income-title-input').value = 'Edit Route';
    document.getElementById('income-amount-input').value = '200';
    document.querySelector('.add-income').click();

    const editButton = document.querySelector('#income .list li #edit');

    budget.deleteOrEdit({
      target: editButton,
    });

    expect(document.getElementById('income-title-input').value).toBe('Edit Route');
    expect(document.getElementById('income-amount-input').value).toBe('200');
  });

  test('editing an existing expense should replace it instead of adding another one', () => {
    loadBudgetModule();

    document.getElementById('expense-title-input').value = 'Dinner';
    document.getElementById('expense-amount-input').value = '25';
    document.querySelector('.add-expense').click();

    document.querySelector('#expense .list li #edit').click();
    document.getElementById('expense-title-input').value = 'Dinner Updated';
    document.getElementById('expense-amount-input').value = '30';
    document.querySelector('.add-expense').click();

    const entries = JSON.parse(localStorage.getItem('entry_list'));
    expect(entries).toEqual([
      { type: 'expense', title: 'Dinner Updated', amount: 30 },
    ]);
    expect(document.querySelector('#expense .list').children.length).toBe(1);
    expect(document.querySelector('#expense .list').textContent).toContain('Dinner Updated');
  });

  test('editing an existing income should replace it instead of adding another one', () => {
    loadBudgetModule();

    document.getElementById('income-title-input').value = 'Old Salary';
    document.getElementById('income-amount-input').value = '1000';
    document.querySelector('.add-income').click();

    document.querySelector('#income .list li #edit').click();
    document.getElementById('income-title-input').value = 'New Salary';
    document.getElementById('income-amount-input').value = '1200';
    document.querySelector('.add-income').click();

    const entries = JSON.parse(localStorage.getItem('entry_list'));
    expect(entries).toEqual([
      { type: 'income', title: 'New Salary', amount: 1200 },
    ]);
    expect(document.querySelector('#income .list').children.length).toBe(1);
    expect(document.querySelector('#income .list').textContent).toContain('New Salary');
  });

  test('delete button should remove entry from UI and localStorage', () => {
    loadBudgetModule();

    document.getElementById('income-title-input').value = 'Gift';
    document.getElementById('income-amount-input').value = '80';
    document.querySelector('.add-income').click();

    document.querySelector('#income .list li #delete').click();

    expect(document.querySelector('#income .list').children.length).toBe(0);
    expect(JSON.parse(localStorage.getItem('entry_list'))).toEqual([]);
  });

  test('deleteOrEdit should do nothing when clicked target is not edit or delete', () => {
    const budget = loadBudgetModule();

    const event = {
      target: document.createElement('span'),
    };

    expect(() => budget.deleteOrEdit(event)).not.toThrow();
  });

  test('editEntry should safely return when entry does not exist', () => {
    const budget = loadBudgetModule();

    const fakeEntry = document.createElement('li');
    fakeEntry.id = '999';

    expect(() => budget.editEntry(fakeEntry)).not.toThrow();
  });

  test('deleteEntry should clear editIndex when deleting the entry currently being edited', () => {
    const budget = loadBudgetModule();

    document.getElementById('income-title-input').value = 'Temp';
    document.getElementById('income-amount-input').value = '10';
    document.querySelector('.add-income').click();

    const entry = document.querySelector('#income .list li');
    budget.editEntry(entry);
    budget.deleteEntry(entry);

    expect(JSON.parse(localStorage.getItem('entry_list'))).toEqual([]);
  });

  test('showEntry should create list item with edit and delete buttons', () => {
    const budget = loadBudgetModule();
    const list = document.createElement('ul');

    budget.showEntry(list, 'income', 'Manual', 123, 0);

    expect(list.children.length).toBe(1);
    expect(list.firstChild.id).toBe('0');
    expect(list.firstChild.className).toBe('income');
    expect(list.textContent).toContain('Manual : $123');
    expect(list.querySelector('#edit')).not.toBeNull();
    expect(list.querySelector('#delete')).not.toBeNull();
  });

  test('CNY input should be stored as USD base amount and rendered as CNY', () => {
    const budget = loadBudgetModule();
    budget.applyCurrency('CNY');

    document.getElementById('income-title-input').value = '人民币收入';
    document.getElementById('income-amount-input').value = '70';
    document.querySelector('.add-income').click();

    expect(JSON.parse(localStorage.getItem('entry_list'))).toEqual([
      { type: 'income', title: '人民币收入', amount: 10 },
    ]);
    expect(document.querySelector('#income .list').textContent).toContain('人民币收入 : ¥70');
  });
});

describe('localStorage handling', () => {
  test('loadEntries should return empty array when no saved data exists', () => {
    const budget = loadBudgetModule();

    localStorage.removeItem('entry_list');

    expect(budget.loadEntries()).toEqual([]);
  });

  test('loadEntries should load valid saved entries', () => {
    const saved = [{ type: 'income', title: 'Saved', amount: 100 }];
    localStorage.setItem('entry_list', JSON.stringify(saved));

    const budget = loadBudgetModule();

    expect(budget.loadEntries()).toEqual(saved);
  });

  test('loadEntries should remove corrupted JSON and alert user', () => {
    localStorage.setItem('entry_list', '{bad json');

    const budget = loadBudgetModule();

    expect(budget.loadEntries()).toEqual([]);
    expect(localStorage.getItem('entry_list')).toBe('[]');
    expect(global.alert).toHaveBeenCalled();
  });

  test('loadEntries should reject non-array saved data', () => {
    localStorage.setItem('entry_list', JSON.stringify({ invalid: true }));

    const budget = loadBudgetModule();

    expect(budget.loadEntries()).toEqual([]);
    expect(localStorage.getItem('entry_list')).toBe('[]');
  });

  test('saveEntries should catch localStorage write errors', () => {
    const budget = loadBudgetModule();
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full');
    });

    budget.saveEntries();

    expect(global.console.error).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith('Unable to save budget data.');

    jest.restoreAllMocks();
  });
});

describe('cookie banner', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('cookie banner should appear after delay if cookies were not accepted', () => {
    loadBudgetModule();
    const banner = document.getElementById('cookie-banner');

    expect(banner.classList.contains('hide')).toBe(true);

    jest.advanceTimersByTime(1000);

    expect(banner.classList.contains('hide')).toBe(false);
  });

  test('clicking accept should save acceptance and hide the banner', () => {
    loadBudgetModule();
    const banner = document.getElementById('cookie-banner');

    document.getElementById('accept-cookies').click();

    expect(localStorage.getItem('cookiesAccepted')).toBe('true');
    expect(banner.classList.contains('hide')).toBe(true);
  });

  test('cookie banner should stay hidden when already accepted', () => {
    localStorage.setItem('cookiesAccepted', 'true');

    loadBudgetModule();
    const banner = document.getElementById('cookie-banner');

    jest.advanceTimersByTime(1500);

    expect(banner.classList.contains('hide')).toBe(true);
  });

  test('should not throw when cookie banner elements are missing', () => {
    jest.resetModules();

    document.body.innerHTML = html.toString();
    global.updateChart = jest.fn();
    global.alert = jest.fn();
    global.console.error = jest.fn();

    expect(() => {
      require('./budget.js');
    }).not.toThrow();
  });

  test('should not throw when only cookie banner exists but accept button is missing', () => {
    jest.resetModules();

    document.body.innerHTML = html.toString() + `
      <div id="cookie-banner" class="hide">Cookie Banner</div>
    `;

    global.updateChart = jest.fn();
    global.alert = jest.fn();
    global.console.error = jest.fn();

    expect(() => {
      require('./budget.js');
    }).not.toThrow();
  });

  test('should not throw when only accept button exists but cookie banner is missing', () => {
    jest.resetModules();

    document.body.innerHTML = html.toString() + `
      <button id="accept-cookies">Accept</button>
    `;

    global.updateChart = jest.fn();
    global.alert = jest.fn();
    global.console.error = jest.fn();

    expect(() => {
      require('./budget.js');
    }).not.toThrow();
  });
});

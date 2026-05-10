const fs = require('fs');
const path = require('path');

// Load HTML into Jest's virtual DOM environment
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
document.body.innerHTML = html.toString();

// Mock external dependencies used in budget.js
// updateChart is not part of the logic under test
global.updateChart = jest.fn();

// Mock alert to prevent actual browser pop-ups during testing
global.alert = jest.fn();

// 3. Import the functions to be tested (Now it includes the Core Bosses!)
const { 
    loadEntries, saveEntries, deleteOrEdit,
    deleteEntry, editEntry, updateUI, showEntry,
    calculateTotal, calculateBalance,
    getPositiveAmount, clearElement, clearInput,
    show, hide, active, inactive
} = require('./budget.js');


// ===== Core logic tests =====

// Test balance calculation logic
describe('calculateBalance', () => {
    test('should correctly compute income minus outcome', () => {
        expect(calculateBalance(1000, 400)).toBe(600);
        expect(calculateBalance(500, 600)).toBe(-100); // negative balance allowed
    });
});

// Test total calculation by type
describe('calculateTotal', () => {
    test('should correctly sum values based on type', () => {
        const list = [
            { type: 'income', amount: 500 },
            { type: 'expense', amount: 200 },
            { type: 'income', amount: 100 }
        ];

        expect(calculateTotal('income', list)).toBe(600);
        expect(calculateTotal('expense', list)).toBe(200);
    });
});


// ===== Input validation tests (new feature) =====

// Ensure only valid positive numbers are accepted
describe('getPositiveAmount validation', () => {

    test('should accept a valid positive number', () => {
        const input = document.createElement('input');
        input.value = '100';

        expect(getPositiveAmount(input)).toBe(100);
    });

    test('should reject zero value', () => {
        const input = document.createElement('input');
        input.value = '0';
        input.focus = jest.fn();

        expect(getPositiveAmount(input)).toBeNull();
    });

    test('should reject negative numbers', () => {
        const input = document.createElement('input');
        input.value = '-50';
        input.focus = jest.fn();

        expect(getPositiveAmount(input)).toBeNull();
    });

    test('should reject non-numeric input', () => {
        const input = document.createElement('input');
        input.value = 'abc';
        input.focus = jest.fn();

        expect(getPositiveAmount(input)).toBeNull();
    });
});


// ===== UI helper function tests (Enhanced by UI/UX update) =====

// Test DOM helper utilities including multi-element handling for UI transitions
describe('UI helper functions', () => {

    test('show should remove "hide" class from a single element', () => {
        const div = document.createElement('div');
        div.classList.add('hide');
        show(div);
        expect(div.classList.contains('hide')).toBe(false);
    });

    test('hide should add "hide" class to multiple elements in an array', () => {
        const div1 = document.createElement('div');
        const div2 = document.createElement('div');

        hide([div1, div2]);

        expect(div1.classList.contains('hide')).toBe(true);
        expect(div2.classList.contains('hide')).toBe(true);
    });

    test('active should add "focus" class for active tab styling', () => {
        const div = document.createElement('div');
        active(div);
        expect(div.classList.contains('focus')).toBe(true);
    });

    test('inactive should remove "focus" class from multiple tab elements', () => {
        const tab1 = document.createElement('div');
        const tab2 = document.createElement('div');
        tab1.classList.add('focus');
        tab2.classList.add('focus');

        inactive([tab1, tab2]);

        expect(tab1.classList.contains('focus')).toBe(false);
        expect(tab2.classList.contains('focus')).toBe(false);
    });

    test('clearInput should reset multiple input values', () => {
        const input1 = document.createElement('input');
        const input2 = document.createElement('input');
        input1.value = '123';
        input2.value = '456';

        clearInput([input1, input2]);

        expect(input1.value).toBe('');
        expect(input2.value).toBe('');
    });

    test('clearElement should remove all inner HTML content', () => {
        const div = document.createElement('div');
        div.innerHTML = '<p>test</p>';

        clearElement([div]);

        expect(div.innerHTML).toBe('');
    });
});


// ===== Additional edge case tests =====

// Improve coverage by testing boundary conditions
describe("additional coverage tests", () => {

    test("calculateTotal should return 0 for empty list", () => {
        expect(calculateTotal("income", [])).toBe(0);
    });

    test("calculateTotal should return 0 when no matching type exists", () => {
        const list = [{ type: "expense", amount: 100 }];
        expect(calculateTotal("income", list)).toBe(0);
    });

    test("calculateBalance should handle zero values", () => {
        expect(calculateBalance(0, 0)).toBe(0);
    });

    test("getPositiveAmount should clear invalid input", () => {
        const input = document.createElement("input");
        input.value = "invalid";
        input.focus = jest.fn();

        getPositiveAmount(input);

        expect(input.value).toBe("");
    });

    test("getPositiveAmount should preserve valid input", () => {
        const input = document.createElement("input");
        input.value = "50";

        getPositiveAmount(input);

        expect(input.value).toBe("50");
    });
});

// ===== Simulated User Interactions (Replaces direct function calls) =====
describe('User Interactions (Simulated Clicks)', () => {
    test('User click on add income button should process data and update UI', () => {
        // 1. Obtain the input box and the add button
        const titleInput = document.getElementById("income-title-input");
        const amountInput = document.getElementById("income-amount-input");
        const addBtn = document.querySelector(".add-income");

        // 2. Simulated user input
        titleInput.value = "Bonus";
        amountInput.value = "1000";
        
        // 3. Simulate a user clicking the button! (This will automatically trigger the listener code in budget.js)
        addBtn.click(); 

        // 4. 验证页面上是否成功渲染了这条收入
        const incomeList = document.querySelector("#income .list");
        expect(incomeList.innerHTML).toContain("Bonus");
        expect(incomeList.innerHTML).toContain("1000");
    });

    test('User click on add expense button should process data and update UI', () => {
        // 1. 获取输入框和添加按钮
        const titleInput = document.getElementById("expense-title-input");
        const amountInput = document.getElementById("expense-amount-input");
        const addBtn = document.querySelector(".add-expense");

        // 2. Simulated user input
        titleInput.value = "Lunch";
        amountInput.value = "50";
        
        // 3. Simulate a user clicking the button
        addBtn.click(); 

        // 4. Check whether this expenditure has been successfully rendered on the verification page
        const expenseList = document.querySelector("#expense .list");
        expect(expenseList.innerHTML).toContain("Lunch");
        expect(expenseList.innerHTML).toContain("50");
    });
    
    test('Tab switching should work correctly', () => {
        const incomeTabBtn = document.querySelector(".second-tab");
        const incomePanel = document.querySelector("#income");
        
        // Click the "Income" tab button at the top.
        incomeTabBtn.click();
        
        // Verify whether the hidden status of the income panel has been removed
        expect(incomePanel.classList.contains("hide")).toBe(false);
    });
});

// ===== Error handling tests =====

describe('localStorage error handling', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('loadEntries should return empty array when no saved data exists', () => {
        expect(loadEntries()).toEqual([]);
    });

    test('loadEntries should return parsed entries for valid localStorage data', () => {
        const mockEntries = [
            { type: 'income', title: 'Salary', amount: 1000 }
        ];

        localStorage.setItem('entry_list', JSON.stringify(mockEntries));

        expect(loadEntries()).toEqual(mockEntries);
    });

    test('loadEntries should reset corrupted localStorage data', () => {
        localStorage.setItem('entry_list', '{ broken json');

        expect(loadEntries()).toEqual([]);
        expect(localStorage.getItem('entry_list')).toBeNull();
        expect(global.alert).toHaveBeenCalled();
    });

    test('loadEntries should reject non-array localStorage data', () => {
        localStorage.setItem('entry_list', JSON.stringify({ invalid: true }));

        expect(loadEntries()).toEqual([]);
        expect(localStorage.getItem('entry_list')).toBeNull();
    });
});

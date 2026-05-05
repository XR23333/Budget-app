const fs = require('fs');
const path = require('path');

// Load HTML into Jest's virtual DOM environment
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Mock external dependencies used in budget.js
// updateChart is not part of the logic under test
global.updateChart = jest.fn();

// Mock alert to prevent actual browser pop-ups during testing
global.alert = jest.fn();

// Import functions to be tested
const {
    calculateTotal,
    calculateBalance,
    getPositiveAmount,
    show,
    hide,
    active,
    inactive,
    clearInput,
    clearElement,
    loadEntries,
    saveEntries
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


// ===== UI helper function tests (for coverage improvement) =====

// Test simple DOM helper utilities
describe('UI helper functions', () => {

    test('show should remove "hide" class', () => {
        const div = document.createElement('div');
        div.classList.add('hide');

        show(div);

        expect(div.classList.contains('hide')).toBe(false);
    });

    test('hide should add "hide" class', () => {
        const div = document.createElement('div');

        hide([div]);

        expect(div.classList.contains('hide')).toBe(true);
    });

    test('active should add "focus" class', () => {
        const div = document.createElement('div');

        active(div);

        expect(div.classList.contains('focus')).toBe(true);
    });

    test('inactive should remove "focus" class', () => {
        const div = document.createElement('div');
        div.classList.add('focus');

        inactive([div]);

        expect(div.classList.contains('focus')).toBe(false);
    });

    test('clearInput should reset input value', () => {
        const input = document.createElement('input');
        input.value = '123';

        clearInput([input]);

        expect(input.value).toBe('');
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
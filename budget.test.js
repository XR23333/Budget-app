const fs = require('fs');
const path = require('path');

// 1. Load HTML into Jest's virtual DOM environment
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// 2. Mock external dependencies
// updateChart is used in budget.js but not needed for testing logic
global.updateChart = jest.fn();

// Mock alert to prevent actual browser alert during tests
global.alert = jest.fn();

// 3. Import functions to be tested
const { calculateTotal, calculateBalance, getPositiveAmount } = require('./budget.js');


// ===== Existing tests =====

// Test Suite: calculateBalance
describe('calculateBalance function', () => {
    test('should correctly calculate income minus outcome', () => {
        expect(calculateBalance(1000, 400)).toBe(600);
        expect(calculateBalance(500, 600)).toBe(-100); // allow negative balance
    });
});

// Test Suite: calculateTotal
describe('calculateTotal function', () => {
    test('should correctly sum amounts by type', () => {
        const mockList = [
            { type: 'income', amount: 500 },
            { type: 'expense', amount: 200 },
            { type: 'income', amount: 100 }
        ];

        expect(calculateTotal('income', mockList)).toBe(600);
        expect(calculateTotal('expense', mockList)).toBe(200);
    });
});

// Test Suite: getPositiveAmount
describe('getPositiveAmount validation', () => {

    test('should return a valid positive number', () => {
        const input = document.createElement('input');
        input.value = '100';

        expect(getPositiveAmount(input)).toBe(100);
    });

    test('should reject zero value', () => {
        const input = document.createElement('input');
        input.value = '0';
        input.focus = jest.fn(); // mock focus to avoid error

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

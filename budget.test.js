const fs = require('fs');
const path = require('path');

// 1. Load HTML into Jest's virtual DOM before requiring the script
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// 2. CRITICAL FIX: Mock the global updateChart function from chart.js
// This tells Jest: "Don't crash when you see updateChart, just pretend it exists."
global.updateChart = jest.fn();

// 3. Import the functions to be tested (Now it will run smoothly!)
const { calculateTotal, calculateBalance } = require('./budget.js');

// Test Suite 1: Test balance calculation
describe('calculateBalance function', () => {
    test('should correctly calculate the difference between income and outcome', () => {
        expect(calculateBalance(1000, 400)).toBe(600); // 1000 - 400 = 600
        expect(calculateBalance(500, 600)).toBe(-100); // Allow negative balance (overdraft)
    });
});

// Test Suite 2: Test total amount calculation
describe('calculateTotal function', () => {
    test('should correctly accumulate the amount of the corresponding type (income or expense)', () => {
        const mockList = [
            { type: 'income', amount: 500 },
            { type: 'expense', amount: 200 },
            { type: 'income', amount: 100 }
        ];
        
        expect(calculateTotal('income', mockList)).toBe(600); // 500 + 100 = 600
        expect(calculateTotal('expense', mockList)).toBe(200);
    });
});
const fs = require('fs');
const path = require('path');

// Load HTML into Jest DOM
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Mock external functions
global.updateChart = jest.fn();
global.alert = jest.fn();

// Import functions
const {
    calculateTotal,
    calculateBalance,
    getPositiveAmount,
    show,
    hide,
    active,
    inactive,
    clearInput,
    clearElement
} = require('./budget.js');


// ===== Basic logic tests =====
describe('calculateBalance', () => {
    test('should calculate correctly', () => {
        expect(calculateBalance(1000, 400)).toBe(600);
        expect(calculateBalance(500, 600)).toBe(-100);
    });
});

describe('calculateTotal', () => {
    test('should sum correctly', () => {
        const list = [
            { type: 'income', amount: 500 },
            { type: 'expense', amount: 200 },
            { type: 'income', amount: 100 }
        ];

        expect(calculateTotal('income', list)).toBe(600);
        expect(calculateTotal('expense', list)).toBe(200);
    });
});


// ===== Your feature (important for marks) =====
describe('getPositiveAmount validation', () => {

    test('accept valid positive number', () => {
        const input = document.createElement('input');
        input.value = '100';

        expect(getPositiveAmount(input)).toBe(100);
    });

    test('reject zero', () => {
        const input = document.createElement('input');
        input.value = '0';
        input.focus = jest.fn();

        expect(getPositiveAmount(input)).toBeNull();
    });

    test('reject negative number', () => {
        const input = document.createElement('input');
        input.value = '-50';
        input.focus = jest.fn();

        expect(getPositiveAmount(input)).toBeNull();
    });

    test('reject non-number', () => {
        const input = document.createElement('input');
        input.value = 'abc';
        input.focus = jest.fn();

        expect(getPositiveAmount(input)).toBeNull();
    });
});


// ===== Simple UI helpers (for coverage boost) =====
describe('UI helper functions', () => {

    test('show removes hide class', () => {
        const div = document.createElement('div');
        div.classList.add('hide');

        show(div);

        expect(div.classList.contains('hide')).toBe(false);
    });

    test('hide adds hide class', () => {
        const div = document.createElement('div');

        hide([div]);

        expect(div.classList.contains('hide')).toBe(true);
    });

    test('active adds focus class', () => {
        const div = document.createElement('div');

        active(div);

        expect(div.classList.contains('focus')).toBe(true);
    });

    test('inactive removes focus class', () => {
        const div = document.createElement('div');
        div.classList.add('focus');

        inactive([div]);

        expect(div.classList.contains('focus')).toBe(false);
    });

    test('clearInput clears value', () => {
        const input = document.createElement('input');
        input.value = '123';

        clearInput([input]);

        expect(input.value).toBe('');
    });

    test('clearElement clears innerHTML', () => {
        const div = document.createElement('div');
        div.innerHTML = '<p>test</p>';

        clearElement([div]);

        expect(div.innerHTML).toBe('');
    });

    describe("additional coverage tests", () => {

        test("calculateTotal with empty list", () => {
            expect(calculateTotal("income", [])).toBe(0);
        });
    
        test("calculateTotal with no matching type", () => {
            const list = [{ type: "expense", amount: 100 }];
            expect(calculateTotal("income", list)).toBe(0);
        });
    
        test("calculateBalance with zero values", () => {
            expect(calculateBalance(0, 0)).toBe(0);
        });
    
        test("getPositiveAmount clears invalid input", () => {
            const input = document.createElement("input");
            input.value = "invalid";
            input.focus = jest.fn();
    
            getPositiveAmount(input);
    
            expect(input.value).toBe("");
        });
    
        test("getPositiveAmount keeps valid input unchanged", () => {
            const input = document.createElement("input");
            input.value = "50";
    
            getPositiveAmount(input);
    
            expect(input.value).toBe("50");
        });
    
    });

});

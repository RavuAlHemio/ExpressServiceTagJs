"use strict";

type Comparison = -1 | 0 | 1;

class BadBignum {
    private static readonly assertions: boolean = true;
    public static readonly zero: BadBignum = new BadBignum('0');
    public static readonly one: BadBignum = new BadBignum('1');

    private readonly number: string;

    constructor(num: string) {
        if (num.length === 0) {
            throw new Error("zero-length numbers are not allowed");
        }
        if (!(/^[0-9]+$/).test(num)) {
            throw new Error("numbers must consist only of the digits 0-9");
        }

        // strip leading zeroes
        let firstNonzeroIndex: number = 0;
        while (firstNonzeroIndex < num.length && num[firstNonzeroIndex] === '0') {
            ++firstNonzeroIndex;
        }
        if (firstNonzeroIndex >= num.length) {
            // all zeroes
            num = '0';
        } else if (firstNonzeroIndex > 0) {
            // leading zeroes
            num = num.substr(firstNonzeroIndex);
        }

        this.number = num;
    }

    toString(): string {
        return this.number;
    }

    add(summand: BadBignum): BadBignum {
        let i1: number = this.number.length - 1;
        let i2: number = summand.number.length - 1;
        let sum: string = "";
        let carry: string = "0";

        while (i1 >= 0 && i2 >= 0) {
            let res: string = BadBignum.fullAdder(this.number[i1], summand.number[i2], carry);
            sum = res[0] + sum;
            carry = res[1];

            --i1;
            --i2;
        }

        while (i1 >= 0) {
            let res: string = BadBignum.fullAdder('0', this.number[i1], carry);
            sum = res[0] + sum;
            carry = res[1];

            --i1;
        }
        while (i2 >= 0) {
            let res: string = BadBignum.fullAdder('0', summand.number[i2], carry);
            sum = res[0] + sum;
            carry = res[1];

            --i2;
        }

        if (carry != '0') {
            sum = carry + sum;
        }

        return new BadBignum(sum);
    };

    sub(subtrahend: BadBignum): BadBignum | null {
        let im: number = this.number.length - 1
        let is: number = subtrahend.number.length - 1;
        let diff: string = "";
        let borrow: string = "0";

        while (im >= 0 && is >= 0) {
            let res: string = BadBignum.fullSubber(this.number[im], subtrahend.number[is], borrow);
            diff = res[0] + diff;
            borrow = res[1];

            --im;
            --is;
        }

        while (im >= 0) {
            let res: string = BadBignum.fullSubber(this.number[im], '0', borrow);
            diff = res[0] + diff;
            borrow = res[1];

            --im;
        }
        while (is >= 0) {
            let res: string = BadBignum.fullSubber('0', subtrahend.number[is], borrow);
            diff = res[0] + diff;
            borrow = res[1];

            --is;
        }

        if (borrow != '0') {
            return null;
        }

        return new BadBignum(diff);
    };

    cmp(other: BadBignum): Comparison {
        if (this.number.length < other.number.length) {
            return -1;
        } else if (this.number.length > other.number.length) {
            return 1;
        }

        for (let i = 0; i < this.number.length; ++i) {
            if (this.number[i] < other.number[i]) {
                return -1;
            } else if (this.number[i] > other.number[i]) {
                return 1;
            }
        }

        return 0;
    }

    mul(factor: BadBignum): BadBignum {
        if (this.number == '0' || factor.number == '0') {
            return BadBignum.zero;
        }

        let comparison: Comparison = this.cmp(factor);
        let biggerFactor: BadBignum = (comparison == -1) ? factor : this;
        let smallerFactor: BadBignum = (comparison == -1) ? this : factor;

        let product: BadBignum = BadBignum.zero;
        for (let i = 0; i < smallerFactor.number.length; ++i) {
            product = new BadBignum(product.number + '0');

            let smallerDigit: string = smallerFactor.number[i];
            let thisProduct: string = BadBignum.multiplyByDigit(biggerFactor.number, smallerDigit);
            product = product.add(new BadBignum(thisProduct));
        }

        return product;
    }

    divRem(divisor: BadBignum): [BadBignum, BadBignum] | null {
        if (divisor.number == '0') {
            return null;
        }
        if (this.number == '0') {
            return [BadBignum.zero, BadBignum.zero];
        }

        let comparison: Comparison = this.cmp(divisor);
        if (comparison == -1) {
            // dividend < divisor => quotient=0, remainder=dividend
            return [BadBignum.zero, this];
        } else if (comparison == 0) {
            // dividend == divisor => quotient=1, remainder=0
            return [BadBignum.one, BadBignum.zero];
        }

        // obtain the initial dividend
        let currentDividend: BadBignum = new BadBignum(this.number[0]);
        let remainingDividendDigits: string = this.number.substr(1);
        while (currentDividend.cmp(divisor) == -1) {
            currentDividend = new BadBignum(currentDividend.number + remainingDividendDigits[0]);
            remainingDividendDigits = remainingDividendDigits.substr(1);
        }

        let quotientString: string = '';
        let ten: BadBignum = new BadBignum('10');
        for (;;) {
            // find the quotient digit by trial multiplication
            let quotientDigit: BadBignum;
            let trialProduct: BadBignum = BadBignum.zero;
            for (
                quotientDigit = BadBignum.zero;
                quotientDigit.cmp(ten) == -1;
                quotientDigit = quotientDigit.add(BadBignum.one)
            ) {
                let nextQuotientDigit: BadBignum = quotientDigit.add(BadBignum.one);

                let nextTrialProduct: BadBignum = divisor.mul(nextQuotientDigit);
                if (nextTrialProduct.cmp(currentDividend) == 1) {
                    // we've gone over
                    break;
                }

                trialProduct = nextTrialProduct;
            }

            BadBignum.assert(quotientDigit.cmp(ten) != 0, "quotient digit has not gone over 9");

            // append to the quotient!
            quotientString += quotientDigit;

            // the subtraction!
            let curDivDiff = currentDividend.sub(trialProduct);
            BadBignum.assert(curDivDiff != null, 'remainder calculation subtraction succeeded');
            currentDividend = <BadBignum>curDivDiff;

            if (remainingDividendDigits.length == 0) {
                // that's it
                // the current dividend is the remainder
                return [new BadBignum(quotientString), currentDividend];
            }

            // next digit from dividend
            currentDividend = new BadBignum(currentDividend.number + remainingDividendDigits[0]);
            remainingDividendDigits = remainingDividendDigits.substr(1);
        }
    }

    private static assert(cond: boolean, msg?: string): void {
        if (BadBignum.assertions) {
            if (!cond) {
                if (msg) {
                    throw new Error(`assertion failed: ${msg}`);
                } else {
                    throw new Error('assertion failed');
                }
            }
        }
    }

    private static assertValidNumber(number: string): void {
        if (BadBignum.assertions) {
            this.assert(number.length == 1 || number[0] != '0', "no leading zeroes");
            this.assert(/^[0-9]+$/.test(number), "only digits between 0 and 9");
        }
    }

    protected static fullAdder(digit1: string, digit2: string, carryIn: string = '0'): string {
        BadBignum.assertValidNumber(digit1);
        BadBignum.assertValidNumber(digit2);
        BadBignum.assertValidNumber(carryIn);
        BadBignum.assert(digit1.length == 1, 'digit1 is a single digit');
        BadBignum.assert(digit2.length == 1, 'digit1 is a single digit');
        BadBignum.assert(carryIn.length == 1, 'carryIn is a single digit');

        if (digit1 > digit2) {
            return BadBignum.fullAdder(digit2, digit1, carryIn);
        }

        let halfResult: string = BadBignum.addTable[digit1][digit2];
        let halfSum: string = halfResult[0];
        let halfCarryOut: string = halfResult[1];

        let fullResult: string = (halfSum > carryIn)
            ? BadBignum.addTable[carryIn][halfSum]
            : BadBignum.addTable[halfSum][carryIn]
        ;
        let fullSum: string = fullResult[0];
        let fullCarryOut: string = (fullResult[1] > halfCarryOut)
            ? BadBignum.addTable[halfCarryOut][fullResult[1]]
            : BadBignum.addTable[fullResult[1]][halfCarryOut]
        ;

        let returnValue: string = fullSum + fullCarryOut[0];
        BadBignum.assert(returnValue.length == 2, 'return value are two digits');

        return returnValue;
    };

    protected static fullSubber(minuend: string, subtrahend: string, borrowIn: string = '0'): string {
        BadBignum.assertValidNumber(minuend);
        BadBignum.assertValidNumber(subtrahend);
        BadBignum.assertValidNumber(borrowIn);
        BadBignum.assert(minuend.length == 1, 'minuend is a single digit');
        BadBignum.assert(subtrahend.length == 1, 'subtrahend is a single digit');
        BadBignum.assert(borrowIn.length == 1, 'borrowIn is a single digit');

        let halfResult: string = BadBignum.subTable[minuend][subtrahend];
        let halfDiff: string = halfResult[0];
        let halfBorrowOut: string = halfResult[1];

        let fullResult: string = BadBignum.subTable[halfDiff][borrowIn];
        let fullDiff: string = fullResult[0];
        let fullBorrowOut: string = (fullResult[1] > halfBorrowOut)
            ? BadBignum.addTable[halfBorrowOut][fullResult[1]]
            : BadBignum.addTable[fullResult[1]][halfBorrowOut]
        ;

        let returnValue: string = fullDiff + fullBorrowOut[0];
        BadBignum.assert(returnValue.length == 2, 'return value are two digits');

        return returnValue;
    }

    protected static multiplyDigit(factor1: string, factor2: string): string {
        BadBignum.assertValidNumber(factor1);
        BadBignum.assertValidNumber(factor2);
        BadBignum.assert(factor1.length == 1, 'factor1 is a single digit');
        BadBignum.assert(factor2.length == 1, 'factor2 is a single digit');

        return (factor1 > factor2)
            ? BadBignum.mulTable[factor2][factor1]
            : BadBignum.mulTable[factor1][factor2]
        ;
    }

    protected static multiplyByDigit(factorNumber: string, factorDigit: string): string {
        BadBignum.assertValidNumber(factorNumber);
        BadBignum.assertValidNumber(factorDigit);
        BadBignum.assert(factorDigit.length == 1, 'factorDigit is a single digit');

        let carry: string = '0';
        let product: string = '';
        for (let i = factorNumber.length - 1; i >= 0; --i) {
            let productResult: string = BadBignum.multiplyDigit(factorNumber[i], factorDigit);
            let productDigitOnly: string = productResult[0];
            let productCarry: string = productResult[1];

            let productDigitAndCarry: string = BadBignum.fullAdder(productDigitOnly, carry);
            let productDigit: string = productDigitAndCarry[0];
            let sumCarry: string = productDigitAndCarry[1];

            let outCarry: string = BadBignum.fullAdder(productCarry, sumCarry);
            BadBignum.assert(outCarry[1] == '0', 'out carry is single-digit');

            product = productDigit + product;
            carry = outCarry[0];
        }

        if (carry != '0') {
            product = carry + product;
        }

        return product;
    }

    protected naiveMul(factor: BadBignum): BadBignum {
        if (this.number == '0' || factor.number == '0') {
            return new BadBignum('0');
        }

        // lol
        let comparison: Comparison = this.cmp(factor);
        let biggerFactor: BadBignum = (comparison == -1) ? factor : this;
        let smallerFactor: BadBignum = (comparison == -1) ? this : factor;
        let product: BadBignum = BadBignum.zero;
        while (smallerFactor.cmp(BadBignum.zero) == 1) {
            product = product.add(biggerFactor);
            smallerFactor = <BadBignum>smallerFactor.sub(BadBignum.one);
        }

        return product;
    }

    private static readonly addTable = {
        '0': {
            '0': '00',
            '1': '10',
            '2': '20',
            '3': '30',
            '4': '40',
            '5': '50',
            '6': '60',
            '7': '70',
            '8': '80',
            '9': '90',
        },
        '1': {
            '1': '20',
            '2': '30',
            '3': '40',
            '4': '50',
            '5': '60',
            '6': '70',
            '7': '80',
            '8': '90',
            '9': '01',
        },
        '2': {
            '2': '40',
            '3': '50',
            '4': '60',
            '5': '70',
            '6': '80',
            '7': '90',
            '8': '01',
            '9': '11',
        },
        '3': {
            '3': '60',
            '4': '70',
            '5': '80',
            '6': '90',
            '7': '01',
            '8': '11',
            '9': '21',
        },
        '4': {
            '4': '80',
            '5': '90',
            '6': '01',
            '7': '11',
            '8': '21',
            '9': '31',
        },
        '5': {
            '5': '01',
            '6': '11',
            '7': '21',
            '8': '31',
            '9': '41',
        },
        '6': {
            '6': '21',
            '7': '31',
            '8': '41',
            '9': '51',
        },
        '7': {
            '7': '41',
            '8': '51',
            '9': '61',
        },
        '8': {
            '8': '61',
            '9': '71',
        },
        '9': {
            '9': '81',
        },
    };

    private static readonly subTable = {
        '0': {
            '0': '00',
            '1': '91',
            '2': '81',
            '3': '71',
            '4': '61',
            '5': '51',
            '6': '41',
            '7': '31',
            '8': '21',
            '9': '11',
        },
        '1': {
            '0': '10',
            '1': '00',
            '2': '91',
            '3': '81',
            '4': '71',
            '5': '61',
            '6': '51',
            '7': '41',
            '8': '31',
            '9': '21',
        },
        '2': {
            '0': '20',
            '1': '10',
            '2': '00',
            '3': '91',
            '4': '81',
            '5': '71',
            '6': '61',
            '7': '51',
            '8': '41',
            '9': '31',
        },
        '3': {
            '0': '30',
            '1': '20',
            '2': '10',
            '3': '00',
            '4': '91',
            '5': '81',
            '6': '71',
            '7': '61',
            '8': '51',
            '9': '41',
        },
        '4': {
            '0': '40',
            '1': '30',
            '2': '20',
            '3': '10',
            '4': '00',
            '5': '91',
            '6': '81',
            '7': '71',
            '8': '61',
            '9': '51',
        },
        '5': {
            '0': '50',
            '1': '40',
            '2': '30',
            '3': '20',
            '4': '10',
            '5': '00',
            '6': '91',
            '7': '81',
            '8': '71',
            '9': '61',
        },
        '6': {
            '0': '60',
            '1': '50',
            '2': '40',
            '3': '30',
            '4': '20',
            '5': '10',
            '6': '00',
            '7': '91',
            '8': '81',
            '9': '71',
        },
        '7': {
            '0': '70',
            '1': '60',
            '2': '50',
            '3': '40',
            '4': '30',
            '5': '20',
            '6': '10',
            '7': '00',
            '8': '91',
            '9': '81',
        },
        '8': {
            '0': '80',
            '1': '70',
            '2': '60',
            '3': '50',
            '4': '40',
            '5': '30',
            '6': '20',
            '7': '10',
            '8': '00',
            '9': '91',
        },
        '9': {
            '0': '90',
            '1': '80',
            '2': '70',
            '3': '60',
            '4': '50',
            '5': '40',
            '6': '30',
            '7': '20',
            '8': '10',
            '9': '00',
        },
    };

    private static readonly mulTable = {
        '0': {
            '0': '00',
            '1': '00',
            '2': '00',
            '3': '00',
            '4': '00',
            '5': '00',
            '6': '00',
            '7': '00',
            '8': '00',
            '9': '00',
        },
        '1': {
            '1': '10',
            '2': '20',
            '3': '30',
            '4': '40',
            '5': '50',
            '6': '60',
            '7': '70',
            '8': '80',
            '9': '90',
        },
        '2': {
            '2': '40',
            '3': '60',
            '4': '80',
            '5': '01',
            '6': '21',
            '7': '41',
            '8': '61',
            '9': '81',
        },
        '3': {
            '3': '90',
            '4': '21',
            '5': '51',
            '6': '81',
            '7': '12',
            '8': '42',
            '9': '72',
        },
        '4': {
            '4': '61',
            '5': '02',
            '6': '42',
            '7': '82',
            '8': '23',
            '9': '63',
        },
        '5': {
            '5': '52',
            '6': '03',
            '7': '53',
            '8': '04',
            '9': '54',
        },
        '6': {
            '6': '63',
            '7': '24',
            '8': '84',
            '9': '45',
        },
        '7': {
            '7': '94',
            '8': '65',
            '9': '36',
        },
        '8': {
            '8': '46',
            '9': '27',
        },
        '9': {
            '9': '18',
        },
    };
};

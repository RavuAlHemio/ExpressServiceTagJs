"use strict";

type Base36Digit =
    "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" |
    "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" |
    "T" | "U" | "V" | "W" | "X" | "Y" | "Z" |
    "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" |
    "t" | "u" | "v" | "w" | "x" | "y" | "z"
;

module ServiceTag {
    const zeroCodePoint: number = ('0').charCodeAt(0);
    const capitalACodePoint: number = ('A').charCodeAt(0);
    const lowercaseACodePoint: number = ('a').charCodeAt(0);
    const thirtySix: BadBignum = new BadBignum('36');

    export function serviceTagToExpressServiceTag(st: string): string {
        // remove whitespace, hyphens and dots
        let sanitizedSt = st.replace(/\s|[-.]/g, '');

        // Horner scheme
        let est: BadBignum = BadBignum.zero;
        for (let i: number = 0; i < sanitizedSt.length; ++i) {
            let letter: string = sanitizedSt[i];

            est = est.mul(thirtySix);

            let number: number | null = fromBase36Digit(letter);
            if (number === null) {
                throw new Error(`invalid base-36 digit: '${letter}'`);
            }
            est = est.add(new BadBignum("" + number));
        }

        return est.toString();
    }

    export function expressServiceTagToServiceTag(est: string): string {
        // remove whitespace, hyphens and dots
        let sanitizedEst = est.replace(/\s|[-.]/g, '');

        let foundIndex: number = sanitizedEst.search(/[^0-9]/);
        if (foundIndex !== -1) {
            throw new Error(`invalid decimal digit: '${sanitizedEst[foundIndex]}'`);
        }

        let st: string = '';
        let toProcess = new BadBignum(sanitizedEst);
        while (toProcess.cmp(BadBignum.zero) == 1) {
            let divRem: [BadBignum, BadBignum] | null = toProcess.divRem(thirtySix);
            if (divRem === null) {
                throw new Error('null result from divRem');
            }

            // quotient will be used next time
            toProcess = divRem[0];

            // remainder won't
            let remainder: number = +divRem[1].toString();
            let base36Digit: string | null = toBase36Digit(remainder);
            if (base36Digit === null) {
                throw new Error('null result from toBase36Digit');
            }
            st = base36Digit + st;
        }

        return st;
    }

    function fromBase36Digit(char: Base36Digit): number;
    function fromBase36Digit(char: string): number | null;
    function fromBase36Digit(char: string): number | null {
        let charValue: number = char.charCodeAt(0);
        if (char >= '0' && char <= '9') {
            return charValue - zeroCodePoint;
        } else if (char >= 'A' && char <= 'Z') {
            return charValue - capitalACodePoint + 10;
        } else if (char >= 'a' && char <= 'z') {
            return charValue - lowercaseACodePoint + 10;
        }

        return null;
    }

    function toBase36Digit(num: number): string | null {
        if (!isInteger(num)) {
            return null;
        }

        if (num >= 0 && num <= 9) {
            return String.fromCharCode(num + zeroCodePoint);
        } else if (num >= 10 && num <= 35) {
            return String.fromCharCode(num - 10 + capitalACodePoint);
        }

        return null;
    }

    function isInteger(num: any): boolean {
        if (typeof(num) === 'number') {
            return (num % 1 === 0);
        }
        return false;
    }
}

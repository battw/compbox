"use strict";

/** Throws an error if 'x' isn't a positive integer */
function assertIsPositiveInteger(x) {
    if (!Number.isInteger(x) || x < 1) {
        throw new Error(x + " isn't a positive integer.");
    }
}

/** Throws an error if 'x' isn't a non-negative integer */
function assertIsNonNegativeInteger(x) {
    if (!Number.isInteger(x) || x < 0) {
        throw new Error(value + "isn't a non-negative integer.");
    }
}

class Word {
    /** 'value' is a non-negative integer.
        'wordLength' is the number of bits in the word.
        Most-significant bits are discarded if they don't fit within the word size.
     */
    constructor(value, wordLength) {
        assertIsNonNegativeInteger(value);
        assertIsPositiveInteger(wordLength);

        this._size = wordLength;
        this._bitMask = 2**wordLength - 1;
        this._value = value & this._bitMask;
    }

    /** Throws an error if 'word' is not an instance of Word. */
    static assertIsWord(word) {
        if (! word instanceof Word) {
            throw new Error("'word' isn't an instance of word: " + word); 
        }
    }

    /** Bitwise AND between 'this' and 'otherWord'.
     The result has the same number of bits as 'this'. */
    and(otherWord) {
        Word.assertIsWord(otherWord);
        let value = (this._value & otherWord._value) & this._bitMask;
        return new Word(value, this._size);
    }

    /** Bitwise OR between 'this' and 'otherWord'.
     The result has the same number of bits as 'this'. */
    or(otherWord) {
        Word.assertIsWord(otherWord);
        let value = (this._value | otherWord._value) & this._bitMask; 
        return new Word(value, this._size);
    }

    /** Bitwise XOR between 'this' and 'otherWord'.
     The result has the same number of bits as 'this'. */
    xor(otherWord) {
        Word.assertIsWord(otherWord);
        let value = (this._value ^ otherWord._value) & this._bitMask; 
        return new Word(value, this._size);
    }

    /** Bitwise NOT on 'this'. */
    not() {
        let value = ~this._value & this._bitMask;
        return new Word(value, this._size);
    }

    /** Shifts the word left, discarding any overflowing bits and zero filling
        from the right. */
    leftShift(n) {
        assertIsNonNegativeInteger(n);
        let value = (this._value << n) & this._bitMask;
        return new Word(value, this._size);
    }

    /** Shifts the word right, discarding any overflowing bits and zero filling
        from the left. */
    rightShift(n) {
        assertIsNonNegativeInteger(n);
        let value = (this._value >>> n) & this._bitMask;
        return new Word(value, this._size);
    }

    /** e.g. '01001', where the string has length equal to the word size. */
    toString() {
        let bitString = (this._value | 2**this._size).toString(2); 
        return bitString.slice(1);
    }
}

class Memory {
    constructor(wordSize, memorySize) {
        this.wordSize = wordSize;
        this.memorySize = memorySize;
    }
}

window.onload = async () => {
    const wordSize = 8;
    const memorySize = 256;
}

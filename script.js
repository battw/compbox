"use strict";

class Word {
    /** bitString should be a string of 1s and 0s e.g. "100011". */
    constructor(bitString) {
        this._checkBitString(bitString);
        this._bitArray = bitString.split('').map(bit => Boolean(Number(bit)));
    }
    
    /** A private function taking an array of booleans and creating a new 'Word' object. **/
    static _fromBitArray(bitArray) {
        return new Word(bitArray.map(Number).map(String).join(''));
    }

    /** The number of bits in the 'Word'. **/
    get size() {
        return this._bitArray.length;
    }

    /** A private function which throws an error if bitString isn't a string or
        it contains a character other than '1' or '0' **/ 
    _checkBitString(bitString) {
        if (typeof bitString !== 'string') {
            throw new Error("Bit string isn't string: " + bitString);
        }
        for (let i = 0; i < bitString.length; i++) {
            if (bitString[i] !== "0" && bitString[i] !== "1") {
                throw new Error("bitString character doesn't equal '0' or '1': "
                                + bitString[i])
            }
        }
    }

    /** A private function which applies the function op to each bit of 'this' and 
        'otherWord'.
        op should be a function which takes two booleans.
        otherWord should be a word of the same length as this word. */
    _applyBitwiseOp(op, otherWord) {
        if (!otherWord instanceof Word) {
            throw new Error("'otherWord' isn't instance of Word");
        }
        if (this.size !== otherWord.size) {
            throw new Error("'otherWord' is different size to this word");
        }
        return  Word._fromBitArray(
            this._bitArray.map((bit, i) => op(bit, otherWord._bitArray[i])));
                        
    }

    /** Bitwise AND between 'this' and 'otherWord' */
    and(otherWord) {
        return this._applyBitwiseOp((x, y) => x && y, otherWord);
    }

    /** Bitwise OR between 'this' and 'otherWord' */
    or(otherWord) {
        return this._applyBitwiseOp((x, y) => x || y, otherWord);
    }

    /** Bitwise NOT on 'this' */
    not() {
        return Word._fromBitArray(this._bitArray.map(x => !x));
    }

    leftShift(n) {
    }

    /** e.g. '01001' */
    toString() {
        return this._bitArray.map(Number).map(String).join('');
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

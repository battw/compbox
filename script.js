"use strict";


function assertIsInteger(x) {
    if (!Number.isInteger(x)) {
        throw new Error(x + " is not an integer");
    }
}
/** Throws an error if 'x' isn't a positive integer */
function assertIsPositiveInteger(x) {
    if (!Number.isInteger(x) || x < 1) {
        throw new Error(x + " isn't a positive integer.");
    }
}

/** Throws an error if 'x' isn't a non-negative integer */
function assertIsNonNegativeInteger(x) {
    if (!Number.isInteger(x) || x < 0) {
        throw new Error(x + "isn't a non-negative integer.");
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


    get size() {
        return this._size;
    }

    get value() {
        return this._value;
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
    get size() {
        return this._memorySize;
    }
    get wordSize() {
        return this._wordSize;
    }
    constructor(wordSize, memorySize) {
        this._wordSize = wordSize;
        this._memorySize = memorySize;
        this._memoryArray = new Array(memorySize); 
        this._populateMemory();
    }

    _populateMemory() {
        for (let i = 0; i < this._memorySize; i++) {
            this._memoryArray[i] = new Word(0, this._wordSize);
        }
    }

    read(address) {
        this._assertValidAddress(address);
        return this._memoryArray[address];
    }

    write(value, address) {
        this._assertValidAddress(address);
        this._memoryArray[address] = new Word(value, this._wordSize);
    }

    _assertValidAddress(address) {
        assertIsInteger(address);
        if (address < 0 || address > this._memorySize) {
            throw new Error("address out of bounds");
        }
    }
}

class MemoryView {
    constructor(memory, div) {
        this._memory = memory;
        this._div = div;
        this._height = Math.ceil(Math.sqrt(memory.size));
        this._width = this._height;
        this.refresh();
    }

    refresh() {
        console.log("refreshing memory view");
        let table = this._buildTable();
        if (this._div.firstChild) {
            this._div.removeChild(this._div.firstChild);
        }
        this._div.appendChild(table);
    }
    _buildTable() {
        let table = document.createElement("table");
        for (let i = 0; i < this._height; i++) {
            let tr = document.createElement("tr");
            table.appendChild(tr);
            for (let j = 0; j < this._width; j++) {
                let td = document.createElement("td");
                td.innerText = this._memory.read(i*this._width + j);
                tr.appendChild(td);
            }
        }
        return table;
    }
}

class Controller {
    constructor(memory, memoryView, inputDiv) {
        this._memory = memory;
        this._memoryView = memoryView;
        this._inputDiv = inputDiv;
        this._addButtons();
    }

    _addButtons() {
        this._testButton = document.createElement("button");
        this._testButton.innerText = "TEST";
        this._inputDiv.appendChild(this._testButton);
        this._testButton.addEventListener("click", () => this._memoryView.refresh());

        this._andButton = document.createElement("button");
        this._andButton.innerText = "AND";
        this._inputDiv.appendChild(this._andButton);
        this._andButton.addEventListener("click", () => {
            let a = this._memory.read(0);
            let b = this._memory.read(1);
            this._memory.write(a.and(b).value, 2);
            this._memoryView.refresh();
        });

    }


}

window.onload = async () => {
    const wordSize = 8;
    const memorySize = 256;
    let memory = new Memory(wordSize, memorySize);
    memory.write(255, 0);
    memory.write(31, 1);
    let memoryDiv = document.getElementById('memory');
    let memoryView = new MemoryView(memory, memoryDiv);
    let inputDiv = document.getElementById("input");
    let controller = new Controller(memory, memoryView, inputDiv);
}

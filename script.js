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


class Memory {
    get size() {
        return this._memorySize;
    }
    get wordSize() {
        return this._wordSize;
    }
    constructor(wordSize, memorySize) {
        this._wordSize = wordSize;
        this._wordMask = 2**wordSize - 1;
        this._memorySize = memorySize;
        this._memoryArray = new Array(memorySize); 
        this._populateMemory();
    }

    _populateMemory() {
        for (let i = 0; i < this._memorySize; i++) {
            this._memoryArray[i] = 0;
        }
    }

    read(address) {
        this._assertValidAddress(address);
        return this._memoryArray[address];
    }

    write(value, address) {
        this._assertValidAddress(address);
        this._assertValidValue(value);
        this._memoryArray[address] = value & this._wordMask;
    }

    _assertValidAddress(address) {
        assertIsInteger(address);
        if (address < 0 || address > this._memorySize) {
            throw new Error("address out of bounds");
        }
    }

    _assertValidValue(value) {
        assertIsInteger(value);
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
                let value = this._memory.read(i*this._width + j);
                td.innerText = this._toBinaryString(value);
                tr.appendChild(td);
            }
        }
        return table;
    }

    _toBinaryString(value) {
        value |= 2**this._memory.wordSize;
        return value.toString(2).slice(1);
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
            this._memory.write(a & b, 3);
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

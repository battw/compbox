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
        this._observerArray = new Array(0);
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
        this._updateObservers();
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

    registerObserver(obs) {
        this._observerArray.push(obs);
        obs.update(this);
    }

    removeObserver(obs) {
        this._observerArray.filter(o => obs !== o);
    }

    _updateObservers() {
        this._observerArray.forEach(o => o.update(this));
    }
}

class MemoryView {
    constructor() {
        this._div = document.createElement("div")
        this._div.className = "memory-view";
    }

    get div() {
        return this._div;
    }

    update(memory) {
        //console.log(memory);
        let table = this._buildTable(memory);
        if (this._div.firstChild) {
            this._div.removeChild(this._div.firstChild);
        }
        this._div.appendChild(table);
    }

    _buildTable(memory) {
        let table = document.createElement("table");
        let height = Math.ceil(Math.sqrt(memory.size));
        let width = height;
        for (let i = 0; i < height; i++) {
            let tr = document.createElement("tr");
            table.appendChild(tr);
            for (let j = 0; j < width; j++) {
                let td = document.createElement("td");
                let value = memory.read(i*width + j);
                td.innerText = this._toBinaryString(value, memory.wordSize);
                tr.appendChild(td);
            }
        }
        return table;
    }

    _toBinaryString(value, wordSize) {
        value |= 2**wordSize;
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
        });
    }
}

window.onload = async () => {
    const wordSize = 8;
    const memorySize = 256;
    let memory = new Memory(wordSize, memorySize);
    memory.write(255, 0);
    memory.write(31, 1);
    let memoryView = new MemoryView();
    memory.registerObserver(memoryView);
    document.body.appendChild(memoryView.div);


    let inputDiv = document.getElementById("input");
    let controller = new Controller(memory, memoryView, inputDiv);
}

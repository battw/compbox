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

function toBinaryString(value, wordSize) {
    value |= 2**wordSize;
    return value.toString(2).slice(1);
}

class Memory {
    get size() {
        return this._memorySize;
    }
    get wordSize() {
        return this._wordSize;
    }
    get wordMask() {
        return this._wordMask;
    }
    constructor(wordSize, memorySize) {
        this._wordSize = wordSize;
        this._wordMask = 2**wordSize - 1;
        this._memorySize = memorySize;
        this._memoryArray = new Array(memorySize); 
        this._populateMemory();
        this._observers = new Array(0);
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
        this._memoryArray[address] = value & this.wordMask;
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
        this._observers.push(obs);
        obs.update(this);
    }

    removeObserver(obs) {
        this._observers.filter(o => obs !== o);
    }

    _updateObservers() {
        this._observers.forEach(o => o.update(this));
    }
}

class LogicUnit {
    set accumulator(value) {
        this._accumulator = value & this._memory.wordMask;
        this._updateObservers();
    }
    get accumulator() {
        return this._accumulator;
    }

    constructor(memory) {
        this._memory = memory;
        this._accumulator = 0;
        this._observers = new Array(0);
    }

    _readMemory(address) {
        return this._memory.read(address);
    }

    or(address) {
        this.accumulator |= this._readMemory(address);
    }

    not() {
        this.accumulator = ~this.accumulator;
    }

   leftShift() {
       this.accumulator <<= 1;
   }

   rightShift() {
       this.accumulator >>>= 1;
   }

   store(address) {
        this._memory.write(this.accumulator, address);
        this._updateObservers();
   }

   registerObserver(obs) {
       this._observers.push(obs);
       this._updateObservers()
   }

   _updateObservers() {
        this._observers.forEach(obs => obs.update(this));
   }
}

class MemoryView {
    constructor() {
        this._div = document.createElement("div")
        this._div.className = "memory-view";
        this._cellClickObservers = new Array(0);
    }

    get div() {
        return this._div;
    }

    update(memory) {
        let table = this._buildTable(memory);
        if (this._div.firstChild) {
            this._div.removeChild(this._div.firstChild);
        }
        this._div.appendChild(table);
    }

    //TODO Make this clean by extracting subroutines.
    _buildTable(memory) {
        let table = document.createElement("table");
        let height = Math.ceil(Math.sqrt(memory.size));
        let width = height;
        for (let i = 0; i < height; i++) {
            let row = table.insertRow();
            for (let j = 0; j < width; j++) {
                let cell = row.insertCell();
                let address = i*width + j
                let value = memory.read(address);
                cell.innerText = toBinaryString(value, memory.wordSize);
                cell.setAttribute("data-address", address.toString());
                cell.addEventListener("click", () => this._reportCellClick(address));
            }
        }
        return table;
    }

    _registerCellClickObserver(obs) {
        this._cellClickObservers.push(obs);
    }

    _reportCellClick(address) {
        this._cellClickObservers.forEach(obs => obs.reportCellClick(address));
    }
}

//TODO separate the logic from the html.
class Controller {
    constructor(memory, logicUnit, inputDiv) {
        this._memory = memory;
        this._logicUnit = logicUnit;
        this._inputDiv = inputDiv;
        this._address = 0;
        this._addInputElements();
    }

    _addInputElements() {
        this._addButton("or-button", "OR", () => this._logicUnit.or(this._address));
        this._addButton("not-button", "NOT", () => this._logicUnit.not());
        this._addButton("left-shift-button", "LSHIFT", () => this._logicUnit.leftShift());
        this._addButton("right-shift-button", "RSHIFT", () => this._logicUnit.rightShift());
        this._addButton("store-button", "STORE", () => this._logicUnit.store(this._address));
        this._addLabel("accumulator-label", "Accumulator:");
        this._addLabel("register-field", "");
        this._addLabel("address-label", "Address:");
        this._addTextField("address-field");
        this._addLabel("value-label", "Value:");
        this._addLabel("value-field", "");
        this.setAddress(0);
    }

    _addTextField(id) {
        let textField = document.createElement("input");
        textField.setAttribute("id", id);
        textField.setAttribute("type", "text");
        this._inputDiv.appendChild(textField);
    }
    _addLabel(id, text) {
        let label = document.createElement("label");
        label.setAttribute("id", id);
        label.innerText = text;
        this._inputDiv.appendChild(label);
    }

    _addButton(id, text, callback) {
        let button = document.createElement("button");
        button.setAttribute("id", id);
        button.innerText = text;
        button.addEventListener("click", callback);
        this._inputDiv.appendChild(button);
    }
    // Method for cellClickObserver callback from MemoryView.
    reportCellClick(address) {
        this.setAddress(address);
    }

    setAddress(address) {
        this._address  = address;
        let addressField  = document.getElementById("address-field");
        let valueField = document.getElementById("value-field");
        if (addressField && valueField) {
            addressField.value = toBinaryString(address, this._memory.wordSize);
            valueField.innerText = toBinaryString(this._memory.read(address), this._memory.wordSize);
        }
    }

    update(logicUnit) {
        console.log("update")
        let registerField = document.getElementById("register-field");
        registerField.innerText = toBinaryString(logicUnit.accumulator, this._memory.wordSize);
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
    let memoryViewContainer = document.getElementById("memory-view-container");
    memoryViewContainer.appendChild(memoryView.div);
    let logicUnit = new LogicUnit(memory);

    let inputDiv = document.getElementById("input-container");
    let controller = new Controller(memory, logicUnit, inputDiv);
    memoryView._registerCellClickObserver(controller);
    logicUnit.registerObserver(controller);
}

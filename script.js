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

function createDiv(id, classes) {
    let div = document.createElement("div");
    if (typeof id === "string" && id.length > 0) {
        div.setAttribute("id", id);
    }
    if (typeof id === "string" && id.length > 0) {
        div.className = classes;
    }
    return div;
}

class Memory {
    _wordSize;
    _wordMask;
    _memorySize;
    _memoryArray;
    _observers;

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
        obs.memoryUpdate(this);
    }

    removeObserver(obs) {
        this._observers.filter(o => obs !== o);
    }

    _updateObservers() {
        this._observers.forEach(o => o.memoryUpdate(this));
    }
}

class LogicUnit {
    _memory;
    _accumulator;
    _observers;

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

    readMemory(address) {
        return this._memory.read(address);
    }

    or(address) {
        this.accumulator |= this.readMemory(address);
    }

    and(address) {
        this.accumulator &= this.readMemory(address);
    }

    xor(address) {
        this.accumulator ^= this.readMemory(address);
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
       obs.logicUnitUpdate(this);
   }

   _updateObservers() {
        this._observers.forEach(obs => obs.logicUnitUpdate(this));
   }
}

class AddressRegister {
    _memory;
    _address;
    _value;
    _observers;

    get address() {
        return this._address;
    }

    set address(address) {
        this._address = address;
        this._value = this._memory.read(address);
        this._updateObservers();
    }

    get value() {
        return this._value;
    }

    constructor(memory) {
       this._memory = memory;
       this._address = 0;
       this._value = memory.read(0);
       this._observers = new Array(0);
    }

    registerObserver(obs) {
       this._observers.push(obs);
       obs.addressRegisterUpdate(this);
    }

    _updateObservers() {
        this._observers.forEach((obs) => obs.addressRegisterUpdate(this));
    }
}

class MemoryView {
    _div;
    _cellClickObservers;

    get div() {
        return this._div;
    }

    constructor() {
        this._div = createDiv("memory-view");
        this._cellClickObservers = new Array(0);
    }

    memoryUpdate(memory) {
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
        this._cellClickObservers.forEach(obs => obs.onMemoryViewCellClick(address));
    }
}

class LogicView {
    _wordSize;
    _div;
    _registerField;
    _addressField;
    _valueField;

    get div() {
        return this._div;
    }

    constructor(wordSize) {
        this._wordSize = wordSize;
        this._div = createDiv("logic-view");
        this._addFields();
    }

    _addFields() {
        this._addLabel("accumulator-label", "Accumulator:");
        this._registerField = this._addLabel("register-field", "");
        this._addLabel("address-label", "Address:");
        this._addressField = this._addTextField("address-field");
        this._addLabel("value-label", "Value:");
        this._valueField = this._addLabel("value-field", "");
    }

    _addLabel(id, text) {
        let label = document.createElement("label");
        label.setAttribute("id", id);
        label.innerText = text;
        this._div.appendChild(label);
        return label;
    }

    _addTextField(id) {
        let textField = document.createElement("input");
        textField.setAttribute("id", id);
        textField.setAttribute("type", "text");
        this._div.appendChild(textField);
        return textField;
    }

    // Method for LogicUnit observer callback.
    logicUnitUpdate(logicUnit) {
        this._registerField.innerText = toBinaryString(logicUnit.accumulator, this._wordSize);
    }

    addressRegisterUpdate(addressRegister) {
        if (this._addressField && this._valueField) {
            this._addressField.value = toBinaryString(addressRegister.address, this._wordSize);
            this._valueField.innerText = toBinaryString(addressRegister.value, this._wordSize);
        }
    }
}

class Controller {
    _logicUnit;
    _addressRegister;
    _div;

    get div() {
        return this._div;
    }

    constructor(logicUnit, addressRegister) {
        this._logicUnit = logicUnit;
        this._addressRegister = addressRegister;
        this._div = createDiv("controller");
        this._addInputElements();
    }

    _addInputElements() {
        this._addButtons();
    }

    _addButtons() {
        this._addButton("and-button", "AND", () => this._logicUnit.and(this._addressRegister.address));
        this._addButton("or-button", "OR", () => this._logicUnit.or(this._addressRegister.address));
        this._addButton("xor-button", "XOR", () => this._logicUnit.xor(this._addressRegister.address));
        this._addButton("not-button", "NOT", () => this._logicUnit.not());
        this._addButton("left-shift-button", "LSHIFT", () => this._logicUnit.leftShift());
        this._addButton("right-shift-button", "RSHIFT", () => this._logicUnit.rightShift());
        this._addButton("store-button", "STORE", () => this._logicUnit.store(this._addressRegister.address));
    }

    _addButton(id, text, callback) {
        let button = document.createElement("button");
        button.setAttribute("id", id);
        button.innerText = text;
        button.addEventListener("click", callback);
        this._div.appendChild(button);
    }


    setAddress(address) {
        this._addressRegister.address = address;
    }

    // Method for cellClickObserver callback from MemoryView.
    onMemoryViewCellClick(address) {
        this.setAddress(address);
    }
}

window.onload = async () => {
    const wordSize = 8;
    const memorySize = 2**wordSize;

    let memoryViewContainer = document.getElementById("memory-view-container");
    let controllerContainer = document.getElementById("command-unit");

    let memory = new Memory(wordSize, memorySize);
    let memoryView = new MemoryView();
    let logicUnit = new LogicUnit(memory);
    let logicView = new LogicView(wordSize);
    let addressRegister = new AddressRegister(memory);
    let controller = new Controller(logicUnit, addressRegister);

    memory.registerObserver(memoryView);
    memoryView._registerCellClickObserver(controller);
    logicUnit.registerObserver(logicView);
    addressRegister.registerObserver(logicView);

    memoryViewContainer.appendChild(memoryView.div);
    controllerContainer.appendChild(logicView.div);
    controllerContainer.appendChild(controller.div);

    memory.write(1, 0);
}

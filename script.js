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
    value |= 2 ** wordSize;
    return value.toString(2).slice(1);
}

function createDiv(id, classes) {
    let div = document.createElement("div");
    if (typeof id === "string" && id.length > 0) {
        div.setAttribute("id", id);
    }
    if (typeof classes === "string" && classes.length > 0) {
        div.className = classes;
    }
    return div;
}

class Memory {
    _memorySize;
    _memoryArray;
    _observers;
    _wordSize;
    _wordMask;

    constructor(wordSize, memorySize) {
        this._wordSize = wordSize;
        this._wordMask = 2 ** wordSize - 1;
        this._memorySize = memorySize;
        this._memoryArray = new Array(memorySize);
        this._populateMemory();
        this._observers = new Array(0);
    }


    get wordSize() {
        return this._wordSize;
    }


    get wordMask() {
        return this._wordMask;
    }

    get size() {
        return this._memorySize;
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

class Machine {
    _memory;
    _observers;
    _accumulator;

    constructor(wordSize, memorySize) {
        this.wordSize = wordSize;
        this.memorySize = memorySize;
        this._memory = new Memory(wordSize, memorySize);
        this._accumulator = 0;
        this._observers = new Array(0);
    }


    get accumulator() {
        return this._accumulator;
    }

    set accumulator(value) {
        this._accumulator = value & this._memory.wordMask;
        this._updateObservers();
    }

    read(address) {
        return this._memory.read(address);
    }

    write(value, address) {
        this._memory.write(value, address);
        this._updateObservers();
    }

    or(address) {
        this.accumulator |= this.read(address);
    }

    and(address) {
        this.accumulator &= this.read(address);
    }

    xor(address) {
        this.accumulator ^= this.read(address);
    }


    not() {
        this.accumulator = ~this.accumulator;
    }

    lshift() {
        this.accumulator <<= 1;
    }

    rshift() {
        this.accumulator >>>= 1;
    }

    load(address) {
        this.accumulator = this._memory.read(address);
    }

    store(address) {
        this._memory.write(this.accumulator, address);
        this._updateObservers();
    }

    registerObserver(obs) {
        this._observers.push(obs);
        obs.update(this);
    }

    _updateObservers() {
        this._observers.forEach(obs => obs.update(this));
    }
}


class MemoryView {
    _div;

    constructor(wordSize) {
        this._wordSize = wordSize;
        this._div = createDiv("memory-view");
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

    _buildTable(machine) {
        let table = document.createElement("table");
        //TODO Height and width should be specified somewhere else.
        let height = Math.ceil(Math.sqrt(machine.memorySize));
        let width = height;
        for (let i = 0; i < height; i++) {
            let row = table.insertRow();
            for (let j = 0; j < width; j++) {
                let address = i * width + j;
                this._addMemoryCell(row, address, machine.read(address));
            }
        }
        return table;
    }

    _addMemoryCell(row, address, value) {
        let cell = row.insertCell();
        cell.innerText = toBinaryString(value, this._wordSize);
        cell.setAttribute("data-address", address.toString());
        cell.className = "memory-cell";
    }
}

class View {
    _registerField;
    _addressField;
    _memoryView;
    _valueField;
    _div;
    _address;
    _value;

    constructor(wordSize) {
        this._div = createDiv("logic-view");
        this._wordSize = wordSize;
        this._memoryView = new MemoryView(wordSize);
        this._div.appendChild(this._memoryView.div);
        this._addFields();
    }


    get div() {
        return this._div;
    }


    set address(addr) {
        this._address = addr;
        this._addressField.innerText = toBinaryString(this._address, this._wordSize);
    }


    set value(val) {
        this._value = val;
        this._valueField.innerText = toBinaryString(val, this._wordSize);
    }

    set accumulator(acc) {
        this._registerField.innerText = toBinaryString(acc, this._wordSize);
    }

    _addFields() {
        this._addLabel("accumulator-label", "Accumulator:");
        this._registerField = this._addLabel("register-field", "");
        this._addLabel("address-label", "Address:");
        this._addressField = this._addLabel("address-field");
        this._addLabel("value-label", "Value:");
        this._valueField = this._addLabel("value-field", "");
    }

    _addLabel(id, text) {
        let label = document.createElement("label");
        label.setAttribute("id", id);
        label.className = "display-label";
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

    update(machine) {
        this.accumulator = machine.accumulator;
        this.value = machine.read(this._address);
        this._memoryView.update(machine);
    }
}

class Controller {
    _machine;
    _machineView;
    _address;
    _div;

    constructor(machine, machineView) {
        this._machine = machine;
        this._machineView = machineView;
        this.address = 0;
        this._div = createDiv("controller");
        this._addButtons();
        this._registerTableClickCallback();
    }


    get address() {
        return this._address;
    }

    set address(addr) {
        this._address = addr;
        this._machineView.address = addr;
        this._machineView.value = this._machine.read(addr);
    }

    get div() {
        return this._div;
    }

    _addButtons() {
        this._addButton("and-button", "AND",
            () => this._machine.and(this.address));
        this._addButton("or-button", "OR",
            () => this._machine.or(this.address));
        this._addButton("xor-button", "XOR",
            () => this._machine.xor(this.address));
        this._addButton("not-button", "NOT",
            () => this._machine.not());
        this._addButton("left-shift-button", "LSHIFT",
            () => this._machine.leftShift());
        this._addButton("right-shift-button", "RSHIFT",
            () => this._machine.rightShift());
        this._addButton("load-button", "LOAD",
            () => {
                this._machine.load(this.address)
            });
        this._addButton("store-button", "STORE",
            () => {
                this._machine.store(this.address)
            });
    }

    _addButton(id, text, callback) {
        let button = document.createElement("button");
        button.setAttribute("id", id);
        button.innerText = text;
        button.addEventListener("click", callback);
        this._div.appendChild(button);
    }

    _registerTableClickCallback() {
        document.addEventListener("click",
            (event) => {
                if (event.originalTarget.classList.contains("memory-cell")) {
                    this.address = Number(event.originalTarget.getAttribute("data-address"));
                }
            });
    }
}

class Instruction {
    constructor(name, args) {
        this.name = name
        this.args = args;
    }
}


class Program {
    constructor(machine) {
        this._machine = machine;
        this._instructions = new Array(0);
        this._observers = new Array(0);
        this._programCounter = 0;
    }

    get length() {
        return this._instructions.length;
    }

    get counter() {
        return this._programCounter;
    }

    append(name, args) {
        this._instructions.push(new Instruction(name, args));
    }

    insert(name, args, position) {
        this._instructions.splice(position, 0, new Instruction(name, args));
    }

    getInstruction(index) {
        return this._instructions[index];
    }

    registerObserver(obs) {
        this._observers.push(obs);
        obs.update(this);
    }

    _updateObservers() {
        this._observers.forEach(obs => obs.update(this));
    }

    step() {
        let instruction = this.getInstruction(this._programCounter);
        this._machine[instruction.name].apply(this._machine, instruction.args);
        this._updateObservers();
        this._programCounter++;
    }
}

class ProgramView {
    _wordSize;

    constructor(wordSize) {
        this._wordSize = wordSize;
        this._div = createDiv("program-view");
    }

    _div;

    get div() {
        return this._div;
    }

    update(program) {
        let table = document.createElement("table");
        for (let i = 0; i < program.length; i++) {
            let instruction = program.getInstruction(i);
            let isCurrentInstruction = i === program.counter;
            this._addInstruction(instruction.name, instruction.args, table, isCurrentInstruction);
        }
        this._div.textContent = "";
        this._div.appendChild(table);
    }

    _addInstruction(name, args, table, isCurrentInstruction) {
        let row = table.insertRow();
        row.className = "instruction";
        if (isCurrentInstruction) {
            row.className += " instruction-current";
        }
        let nameCell = row.insertCell();
        nameCell.innerText = name;
        let argString = (args.length > 0) ? toBinaryString(args[0], this._wordSize) : "";
        let argCell = row.insertCell();
        argCell.innerText = argString;
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.onload = async () => {
    const wordSize = 8;
    const memorySize = 2 ** wordSize;

    let machine = new Machine(wordSize, memorySize);
    let view = new View(wordSize);
    let controller = new Controller(machine, view);

    machine.registerObserver(view);

    let machineDiv = document.getElementById("machine-div");
    let programmerDiv = document.getElementById("programmer-div");


    machineDiv.appendChild(view.div);
    machineDiv.appendChild(controller.div);

    await testInterpreter(machine, programmerDiv);
}

async function testInterpreter(machine, div) {
    machine.write(7, 0);
    machine.write(1, 1);
    // 7 + 1 = 8
    let program = new Program(machine);
    let instructions = [
        "load", [0],
        "xor", [1],
        "store", [2],
        "load", [0],
        "and", [1],
        "lshift", [],
        "store", [1],
        "load", [2],
        "store", [0],
        "load", [0],
        "xor", [1],
        "store", [2],
        "load", [0],
        "and", [1],
        "lshift", [],
        "store", [1],
        "load", [2],
        "store", [0],
        "load", [0],
        "xor", [1],
        "store", [2],
        "load", [0],
        "and", [1],
        "lshift", [],
        "store", [1],
        "load", [2],
        "store", [0],
        "load", [0],
        "xor", [1],
        "store", [2],
        "load", [0],
        "and", [1],
        "lshift", [],
        "store", [1],
        "load", [2],
        "store", [0],
    ];

    for (let i = 0; i < instructions.length - 1; i += 2) {
        program.append(instructions[i], instructions[i + 1]);
    }

    let programView = new ProgramView(machine.wordSize);
    program.registerObserver(programView);
    div.appendChild(programView.div);

    while (program.counter < program.length) {
        program.step();
        await sleep(1000);
    }
}

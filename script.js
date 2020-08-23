//TODO replace classname, id and attributename literals with Constants.
//TODO refactor initialisation of each class to explicitly name each instance variables in constructor.


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

function createLabel(id, classes, text) {
    let label = document.createElement("label");
    label.setAttribute("id", id);
    label.className = classes;
    label.innerText = text;
    return label;
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
        if (address < 0 || address >= this._memorySize) {
            throw new Error("address out of bounds");
        }
    }

    _assertValidValue(value) {
        assertIsInteger(value);
    }
}

class Machine {
    constructor(wordSize, memorySize) {
        this.wordSize = wordSize;
        this.memorySize = memorySize;
        this._memory = new Memory(wordSize, memorySize);
        this._accumulator = 0;
        this._observers = [this];
        this.addressRegister = 0;
        this.dataRegister = this.read(this.addressRegister);
        this.instructionRegister = new Instruction("read", [0]);
        this._action = () => this.read;
    }


    get accumulator() {
        return this._accumulator;
    }

    set accumulator(value) {
        this._accumulator = value & this._memory.wordMask;
        this.updateObservers();
    }

    read(address) {
        return this._memory.read(address);
    }

    write(value, address) {
        this._memory.write(value, address);
        this.updateObservers();
    }

    or() {
        this.accumulator |= this.dataRegister;
        this.updateObservers();
    }

    and() {
        this.accumulator &= this.dataRegister;
        this.updateObservers();
    }

    xor(){
        this.accumulator ^= this.dataRegister;
        this.updateObservers();
    }

    not() {
        this.accumulator = ~this.accumulator;
        this.updateObservers();
    }

    lshift() {
        this.accumulator <<= 1;
        this.updateObservers();
    }

    rshift() {
        this.accumulator >>>= 1;
        this.updateObservers();
    }

    load() {
        this.accumulator = this.dataRegister;
        this.updateObservers();
    }

    store() {
        this.write(this.accumulator, this.addressRegister);
        this.updateObservers();
    }

    decode() {
        this._action = this[this.instructionRegister.name];
        if (this.instructionRegister.args.length > 0) {
            this.addressRegister = this.instructionRegister.args[0];
        }
        this.updateObservers();
    }

    execute() {
        this._action();
    }

    update(_) {
        this.dataRegister = this.read(this.addressRegister);
    }

    registerObserver(obs) {
        this._observers.push(obs);
        obs.update(this);
    }

    updateObservers() {
        this._observers.forEach(obs => obs.update(this));
    }
}


class MemoryView {
    _div;

    constructor(wordSize) {
        this._wordSize = wordSize;
        this._div = createDiv("memory-view");
        this._highlightedAddresses = [];
    }

    get div() {
        return this._div;
    }

    update(machine) {
        let table = this._buildTable(machine);
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
        cell.classList.add("memory-cell");
        if (this._highlightedAddresses.includes(address)) {
            cell.classList.add("memory-cell-highlighted");
        }
    }

    highlightCell(address) {
        this._highlightedAddresses.push(address);
    }

    clearCellHighlights() {
        this._highlightedAddresses =[];
    }
}

class View {
    _memoryView;
    _div;
    _address;

    constructor(wordSize) {
        this._div = createDiv("view");
        this._wordSize = wordSize;
        this._memoryView = new MemoryView(wordSize);
        this._div.appendChild(this._memoryView.div);
        this._addComponents();
        this.address = 0;
    }

    get div() {
        return this._div;
    }

    set address(address) {
        this._address = address;
        this.div.querySelector('[id="address-field"]').innerText
            = toBinaryString(this._address, this._wordSize);
        this._memoryView.clearCellHighlights();
        this._memoryView.highlightCell(address);
    }

    set value(value) {
        this.div.querySelector('[id="data-field"]').innerText
            = toBinaryString(value, this._wordSize);
    }

    set accumulator(acc) {
        this.div.querySelector('[id="accumulator-field"]').innerText
            = toBinaryString(acc, this._wordSize);
    }

    _addComponents() {
       this.div.appendChild(this._createAccumulator());
       this.div.appendChild(this._createAddressRegister());
    }

    _createAccumulator() {
        let div = createDiv("accumulator", "logic-view-div");
        div.appendChild(createLabel("accumulator-label", "logic-view-label", "Accumulator:"));
        div.appendChild(createLabel("accumulator-field", "logic-view-label", ""));
        return div;
    }

    _createAddressRegister() {
        let div = createDiv("address-register", "logic-view-div");
        div.appendChild(createLabel("data-label", "logic-view-label", "Data:"));
        div.appendChild(createLabel("data-field", "logic-view-label", ""));
        div.appendChild(createLabel("address-label", "logic-view-label", "Address:"));
        div.appendChild(createLabel("address-field", "logic-view-label", ""));
        return div;
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

    set address(address) {
        this._address = address;
        this._machineView.address = address;
        this._machineView.value = this._machine.read(address);
        this._machine.updateObservers();
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
            () => this._machine.lshift());
        this._addButton("right-shift-button", "RSHIFT",
            () => this._machine.rshift());
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
        this._machine.instructionRegister = this.getInstruction(this._programCounter);
        this._machine.decode();
        this._machine.execute();
        this._updateObservers();
        this._programCounter++;
    }
}

class ProgramView {
    _wordSize;
    _div;

    constructor(wordSize) {
        this._wordSize = wordSize;
        this._div = createDiv("program-view");
    }

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
            row.classList.add("instruction-current");
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
    const wordSize = 4;
    const memorySize = 2 ** wordSize;

    let machine = new Machine(wordSize, memorySize);
    let view = new View(wordSize);
    let controller = new Controller(machine, view);

    machine.registerObserver(view);

    let machineDiv = document.getElementById("machine-div");
    let programmerDiv = document.getElementById("programmer-div");

    machineDiv.appendChild(view.div);
    machineDiv.appendChild(controller.div);

    await testProgram(machine, programmerDiv);
}

async function testProgram(machine, div) {
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

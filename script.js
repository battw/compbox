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
    _accumulator;
    _observers;

    set accumulator(value) {
        this._accumulator = value & this._memory.wordMask;
        this._updateObservers();
    }
    get accumulator() {
        return this._accumulator;
    }

    constructor(wordSize, memorySize) {
        this.wordSize = wordSize;
        this.memorySize = memorySize;
        this._memory = new Memory(wordSize, memorySize);
        this._accumulator = 0;
        this._observers = new Array(0);
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

   leftShift() {
       this.accumulator <<= 1;
   }

   rightShift() {
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

    get div() {
        return this._div;
    }

    constructor(wordSize) {
        this._wordSize = wordSize;
        this._div = createDiv("memory-view");
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
                let address = i*width + j;
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
    _div;
    _registerField;
    _addressField;
    _memoryView;
    _valueField;
    _address;
    _value;

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

    constructor(wordSize) {
        this._div = createDiv("logic-view");
        this._wordSize = wordSize;
        this._memoryView = new MemoryView(wordSize);
        this._div.appendChild(this._memoryView.div);
        this._addFields();
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

    get div() {
        return this._div;
    }

    set address(addr) {
        this._address = addr;
        this._machineView.address = addr;
        this._machineView.value = this._machine.read(addr);
    }

    get address() {
        return this._address;
    }

    constructor(machine, machineView) {
        this._machine = machine;
        this._machineView = machineView;
        this.address = 0;
        this._div = createDiv("controller");
        this._addButtons();
        this._registerTableClickCallback();
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
            () => { this._machine.load(this.address) });
        this._addButton("store-button", "STORE",
            () => { this._machine.store(this.address) });
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
    get length() {
        return this._instructions.length;
    }

    constructor() {
        this._instructions = new Array(0);
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
}

class Interpreter {
    constructor(program, machine) {
        this._program = program;
        this._machine = machine;
    }

    async run() {
        for (let pc = 0; pc < this._program.length; pc++) {
            let instruction = this._program.getInstruction(pc);
            this._machine[instruction.name].apply(this._machine, instruction.args);
            await sleep(1000);
        }
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

window.onload = async () => {
    const wordSize = 8;
    const memorySize = 2**wordSize;

    let machine = new Machine(wordSize, memorySize);
    let view = new View(wordSize);
    let controller = new Controller(machine, view);

    machine.registerObserver(view);

    let viewContainer = document.getElementById("view-container");

    viewContainer.appendChild(view.div);
    viewContainer.appendChild(controller.div);

    await testInterpreter(machine);
}

async function testInterpreter(machine) {
    machine.write(7,  0);
    machine.write(1, 1);
    // 7 + 1 = 8
    let program = new Program();
    let instructions = [
        "load", [0],
        "xor", [1],
        "store", [2],
        "load", [0],
        "and", [1],
        "leftShift", [],
        "store", [1],
        "load", [2],
        "store", [0],
        "load", [0],
        "xor", [1],
        "store", [2],
        "load", [0],
        "and", [1],
        "leftShift", [],
        "store", [1],
        "load", [2],
        "store", [0],
        "load", [0],
        "xor", [1],
        "store", [2],
        "load", [0],
        "and", [1],
        "leftShift", [],
        "store", [1],
        "load", [2],
        "store", [0],
        "load", [0],
        "xor", [1],
        "store", [2],
        "load", [0],
        "and", [1],
        "leftShift", [],
        "store", [1],
        "load", [2],
        "store", [0],
       ];

    for (let i = 0; i < instructions.length - 1; i += 2) {
        program.append(instructions[i], instructions[i+1]);
    }

    let interpreter = new Interpreter(program, machine);
    interpreter.run();
}

//TODO replace classname, id and attributename literals with Constants.


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

function createLabel(id, className, text) {
    let label = document.createElement("label");
    label.setAttribute("id", id);
    label.className = className;
    label.innerText = text;
    return label;
}

function createButton(id, className, text) {
    let button = document.createElement("button");
    button.setAttribute("id", id);
    button.className = className;
    button.innerText = text;
    return button;
}

class Memory {
    constructor(wordSize, memorySize) {
        this._wordSize = wordSize;
        this._wordMask = 2 ** wordSize - 1;
        this._memorySize = memorySize;
        this._memoryArray = new Array(memorySize);
        this._populateMemory();
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
        this._addressRegister = 0;
        this._dataRegister = this.read(this._addressRegister);
        this.instructionRegister = new Instruction("read", [0]);
        this._action = () => this.read;
    }

    get dataRegister() {
        return this._dataRegister;
    }

    get addressRegister() {
        return this._addressRegister;
    }

    set addressRegister(value) {
        this._addressRegister = value;
        this.updateObservers();
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
        this.accumulator |= this._dataRegister;
        this.updateObservers();
    }

    and() {
        this.accumulator &= this._dataRegister;
        this.updateObservers();
    }

    xor() {
        this.accumulator ^= this._dataRegister;
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
        this.accumulator = this._dataRegister;
        this.updateObservers();
    }

    store() {
        this.write(this.accumulator, this._addressRegister);
        this.updateObservers();
    }

    decode() {
        this._action = this[this.instructionRegister.name];
        if (this.instructionRegister.args.length > 0) {
            this._addressRegister = this.instructionRegister.args[0];
        }
        this.updateObservers();
    }

    execute() {
        this._action();
        this.updateObservers();
    }

    update(_) {
        this._dataRegister = this.read(this._addressRegister);
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
    constructor(wordSize) {
        this._wordSize = wordSize;
        this._div = createDiv("memory-view");
        this._address = 0;
    }

    get div() {
        return this._div;
    }

    update(machine) {
        this._address = machine.addressRegister;
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
        if (this._address === address) {
            cell.classList.add("memory-cell-current");
        }
    }
}

class View {
    constructor(wordSize) {
        this._div = createDiv("view");
        this._wordSize = wordSize;
        this._memoryView = new MemoryView(wordSize);
        this._div.appendChild(this._memoryView.div);
        this._controlPanel = new ControlPanel();
        this._div.appendChild(this._controlPanel.div);
        this._registerView = new RegisterView(wordSize);
        this._div.appendChild(this._registerView.div);
    }

    get div() {
        return this._div;
    }

    set accumulator(acc) {
        this.div.querySelector('[id="accumulator-field"]').innerText
            = toBinaryString(acc, this._wordSize);
    }

    update(machine) {
        this._memoryView.update(machine);
        this._registerView.update(machine);
    }
}

class RegisterView {
    constructor(wordSize) {
        this._wordSize = wordSize;
        this._div = createDiv("register-view");
        this._addComponents(this._div);
    }

    get div() {
        return this._div;
    }

    set accumulator(acc) {
        this.div.querySelector('[id="accumulator-field"]').innerText
            = toBinaryString(acc, this._wordSize);
    }

    _addComponents(div) {
        div.appendChild(this._createAccumulator());
        div.appendChild(this._createAddressRegister());
        div.appendChild(this._createInstructionRegister());
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

    _createInstructionRegister() {
        let div = createDiv("instruction-register", "logic-view-div");
        div.appendChild(createLabel("instruction-label", "logic-view-label", "Instruction:"));
        div.appendChild(createLabel("instruction-field", "logic-view-label", ""));
        return div;
    }


    _updateBinaryField(id, value) {
        this.div.querySelector(`[id="${id}"]`).innerText
            = toBinaryString(value, this._wordSize);
    }

    _updateStringField(id, value) {
        this.div.querySelector(`[id="${id}"]`).innerText
            = value;
    }

    update(machine) {
        this.accumulator = machine.accumulator;
        this._updateBinaryField("address-field", machine.addressRegister);
        this._updateBinaryField("data-field", machine.dataRegister);
        this._updateStringField("instruction-field", machine.instructionRegister.name);
    }
}

class ControlPanel {
    constructor() {
        this._div = createDiv("control-panel");
        this._addButtons(this._div);
    }

    get div() {
        return this._div;
    }

    _addButtons(div) {
        let children = [
            createButton("and-button", "control-panel-button", "AND"),
            createButton("or-button", "control-panel-button", "OR"),
            createButton("xor-button", "control-panel-button", "XOR"),
            createButton("not-button", "control-panel-button", "NOT"),
            createButton("left-shift-button", "control-panel-button", "LSHIFT"),
            createButton("right-shift-button", "control-panel-button", "RSHIFT"),
            createButton("load-button", "control-panel-button", "LOAD"),
            createButton("store-button", "control-panel-button", "STORE"),
        ];
        children.forEach(child => div.appendChild(child));
    }
}

class Controller {
    constructor(machine, view) {
        view.div.addEventListener("click", this._createHandler(machine));
    }

    _createHandler(machine) {
        return (event) => {
            let target = event.originalTarget;
            if (target.classList.contains("memory-cell")) {
                machine.addressRegister = Number(target.getAttribute("data-address"));
            }
            if (target.classList.contains("control-panel-button")) {
                machine[target.innerText.toLowerCase()]();
            }
        }
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
        this.running = false;
        this._phase = "decode";
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
        if (this._phase === "decode") {
            this._machine.instructionRegister = this.getInstruction(this._programCounter);
            this._machine.decode();
            this._phase = "execute";
        } else if (this._phase === "execute") {
            this._machine.execute();
            this._phase = "decode";
            this._programCounter++;
        }
        this._updateObservers();
    }

    async play() {
        this.running = true;
        while (this.running && this._programCounter < this.length) {
           this.step();
           this.running &&= this._programCounter < this.length;
           await sleep(1000);
        }
    }

    stop() {
        this.running = false;
    }
}

class ProgramView {
    constructor(wordSize) {
        this._wordSize = wordSize;
        this._div = createDiv("program-view");
    }

    get div() {
        return this._div;
    }

    update(program) {
        // Remove previous contents from div.
        this._div.textContent = "";
        this._div.appendChild(this._createProgramPanel());
        this._div.appendChild(this._createTable(program));

    }

    _createTable(program) {
        let table = document.createElement("table");
        table.id = "instruction-table";
        for (let i = 0; i < program.length; i++) {
            let instruction = program.getInstruction(i);
            let isCurrentInstruction = i === program.counter;
            this._addInstruction(
                instruction.name, instruction.args, table, isCurrentInstruction);
        }
        return table;
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

    _createProgramPanel() {
        let panel = createDiv("program-panel");
        let buttons = [
            createButton("play-button", "program-button", "Play"),
            createButton("stop-button", "program-button", "Stop"),
            createButton("step-button", "program-button", "Step"),
        ];
        buttons.forEach(button => panel.appendChild(button));
        return panel;
    }
}

class ProgramControl {
    constructor(program, programView) {
        programView.div.addEventListener("click", this._createHandler(program));
    }

    _createHandler(program) {
        return async (event) => {
            let target = event.originalTarget;
            if (target.classList.contains("program-button")) {
                switch (target.id) {
                    case "play-button":
                        await program.play();
                        break;
                    case "stop-button":
                        program.stop();
                        break;
                    case "step-button":
                        program.step();
                        break;
                }
            }
        }
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
    machineDiv.appendChild(view.div);

    let programmerDiv = document.getElementById("programmer-div");
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
    let programControl = new ProgramControl(program, programView);

    program.registerObserver(programView);
    div.appendChild(programView.div);

}

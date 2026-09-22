const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

async function setup() {
    class Element {
        constructor() { this.attributes = []; this.tagName = 'INPUT'; this.type = 'password'; this.value = ''; this.events = []; }
        hasAttribute() { return false; }
        getAttribute(name) { return name === 'type' ? this.type : null; }
        dispatchEvent(event) { this.events.push(event.type); }
    }
    const context = vm.createContext({
        HTMLElement: Element, SVGElement: class {}, atob,
        CustomEvent: class { constructor(type) { this.type = type; } }
    });
    const module = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, '../src/setValue.js'), 'utf8'), { context });
    const handlers = await import('../../CoCreate-utils/src/modules/valueHandler.js');
    await module.link((specifier) => {
        if (specifier === '@cocreate/utils') {
            return new vm.SyntheticModule(Object.keys(handlers), function () {
                for (const [name, value] of Object.entries(handlers)) this.setExport(name, value);
            }, { context });
        }
        return new vm.SyntheticModule(['storage'], function () {
            this.setExport('storage', new WeakMap());
        }, { context });
    });
    await module.evaluate();
    return new Element();
}

for (const [name, incoming, expected] of [
    ['legacy Base64', btoa('sample-password!'), 'sample-password!'],
    ['plain-text credential', 'sample-password!', 'sample-password!'],
    ['malformed padding', 'YWJj===', 'YWJj==='],
    ['plain Unicode', 'sample-密碼', 'sample-密碼'],
    ['empty value', '', '']
]) {
    test(`password setValue handles ${name} and completes event dispatch`, async () => {
        const element = await setup();
        element.setValue(incoming);
        assert.equal(element.value, expected);
        assert.ok(element.events.includes('input'));
        assert.ok(element.events.includes('change'));
    });
}

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

async function setup() {
    class Element {
        constructor(attributes = {}, tagName = 'TEXTAREA') {
            this.attributes = Object.entries(attributes).map(([name, value]) => ({ name, value }));
            this.attributes.getNamedItem = name => this.attributes.find(attr => attr.name === name);
            this.tagName = tagName;
            this.value = '';
            this.events = [];
        }
        getAttribute(name) { return this.attributes.getNamedItem(name)?.value ?? null; }
        hasAttribute(name) { return this.getAttribute(name) !== null; }
        dispatchEvent(event) { this.events.push(event.type); }
    }
    const context = vm.createContext({
        HTMLElement: Element, SVGElement: class {}, console,
        atob, btoa, TextEncoder, TextDecoder,
        CustomEvent: class { constructor(type) { this.type = type; } }
    });
    const modules = new Map();
    const load = name => {
        if (!modules.has(name)) {
            modules.set(name, new vm.SourceTextModule(
                fs.readFileSync(path.join(__dirname, '../src', name), 'utf8'), { context }
            ));
        }
        return modules.get(name);
    };
    const handlers = await import('../../CoCreate-utils/src/modules/valueHandler.js');
    const utils = new vm.SyntheticModule(['astSync', 'astAsync', ...Object.keys(handlers)], function () {
        for (const [name, value] of Object.entries(handlers)) this.setExport(name, value);
        this.setExport('astSync', ({ executeAST }) => executeAST);
        this.setExport('astAsync', async ({ executeAST }) => executeAST);
    }, { context });
    const getter = load('getValue.js');
    await getter.link(() => utils);
    await getter.evaluate();
    const setter = load('setValue.js');
    await setter.link(specifier => specifier === '@cocreate/utils' ? utils : load(specifier));
    await setter.evaluate();
    return Element;
}

test('getter transformations remain read-only and match in sync/async paths', async () => {
    const Element = await setup();
    const el = new Element({ 'get-value-uppercase': '', 'get-value-replace': 'HELLO', 'get-value-replacement': 'HI' });
    el.setValue('hello');
    assert.equal(el.value, 'hello');
    assert.equal(el.getValue(), 'HI');
    assert.equal(await el.getValueAsync(), 'HI');
});

test('setter transformations run before rendering and are not repeated by getters', async () => {
    const Element = await setup();
    const el = new Element({ 'set-value-replace': 'a', 'set-value-replacement': 'aa' });
    el.setValue('a');
    assert.equal(el.value, 'aa');
    assert.equal(el.getValue(), 'aa');
    assert.deepEqual(el.events, ['input', 'change']);
});

test('setter supports case, regex, and Unicode encoding/decoding', async () => {
    const Element = await setup();
    const encoded = new Element({ 'set-value-uppercase': '', 'set-value-encode': 'base64' });
    encoded.setValue('hello 密碼');
    const decoded = new Element({ 'set-value-decode': 'base64' });
    decoded.setValue(encoded.value);
    assert.equal(decoded.value, 'HELLO 密碼');
});

test('component storage retains parsed objects and arrays', async () => {
    const Element = await setup();
    for (const [type, input, expected] of [
        ['object', '{"a":1}', { a: 1 }],
        ['array.$keys', '{"a":1}', ['a']],
        ['boolean', 'false', false]
    ]) {
        const el = new Element({ component: '', 'set-value-type': type }, 'DIV');
        el.setValue(input);
        assert.equal(JSON.stringify(el.getValue()), JSON.stringify(expected));
        assert.deepEqual(el.events, ['input', 'change']);
    }
});

test('existing objects keep their identity in component storage', async () => {
    const Element = await setup();
    const value = { a: 1 };
    const el = new Element({ component: '', 'set-value-type': 'object', 'set-value-uppercase': '' }, 'DIV');
    el.setValue(value);
    assert.equal(el.getValue(), value);
});

test('textarea serializes objects after setter transformations', async () => {
    const Element = await setup();
    const el = new Element({ 'set-value-decode': 'json', 'set-value-type': 'object' });
    el.setValue('{"a":1}');
    assert.equal(el.value, JSON.stringify({ a: 1 }, null, 2));
});

test('regex may return a non-string without subsequent string operations failing', async () => {
    const Element = await setup();
    const el = new Element({ component: '', 'set-value-split': ',', 'set-value-replace': 'a' }, 'DIV');
    el.setValue('a,b');
    assert.equal(JSON.stringify(el.getValue()), '["a","b"]');
});

test('getter JSON decoding can precede object conversion', async () => {
    const Element = await setup();
    const el = new Element({ 'get-value-decode': 'json', 'get-value-type': 'object' });
    el.value = '{"a":1}';
    assert.equal(JSON.stringify(el.getValue()), '{"a":1}');
    assert.equal(JSON.stringify(await el.getValueAsync()), '{"a":1}');
});

test('unscoped attributes transform both reads and writes', async () => {
    const Element = await setup();
    const el = new Element({ 'value-replace': 'a', 'value-replacement': 'aa' });
    el.setValue('a');
    assert.equal(el.value, 'aa');
    assert.equal(el.getValue(), 'aaa');
    assert.equal(await el.getValueAsync(), 'aaa');
});

test('scoped replacements override shared operations in either attribute order', async () => {
    const Element = await setup();
    const entries = [
        ['value-replace', 'a'], ['value-replacement', 'shared'],
        ['get-value-replace', 'set'], ['get-value-replacement', 'get'],
        ['set-value-replace', 'a'], ['set-value-replacement', 'set']
    ];
    for (const attributes of [entries, [...entries].reverse()]) {
        const el = new Element(Object.fromEntries(attributes));
        el.setValue('a');
        assert.equal(el.value, 'set');
        assert.equal(el.getValue(), 'get');
        assert.equal(await el.getValueAsync(), 'get');
    }
});

test('scoped false and empty values disable shared transformations', async () => {
    const Element = await setup();
    const el = new Element({
        'value-uppercase': '', 'set-value-uppercase': 'false',
        'value-replace': 'a', 'value-replacement': 'b',
        'set-value-replace': '', 'get-value-replace': 'false',
        'value-encode': 'base64', 'set-value-encode': 'false', 'get-value-encode': ''
    });
    el.setValue('a');
    assert.equal(el.value, 'a');
    assert.equal(el.getValue(), 'A');
});

test('each option falls back independently to shared attributes', async () => {
    const Element = await setup();
    const el = new Element({ 'set-value-uppercase': '', 'value-replace': 'A', 'value-replacement': 'B' });
    el.setValue('a');
    assert.equal(el.value, 'B');
});

test('shared and scoped type conversion applies before component storage', async () => {
    const Element = await setup();
    const shared = new Element({ component: '', 'value-type': 'object' }, 'DIV');
    shared.setValue('{"a":1}');
    assert.equal(JSON.stringify(shared.getValue()), '{"a":1}');
    const scoped = new Element({ component: '', 'value-type': 'object', 'set-value-type': 'array.$keys' }, 'DIV');
    scoped.setValue('{"a":1}');
    assert.equal(JSON.stringify(scoped.getValue()), '["a"]');
});

test('scoped getter type and prefixes override shared options', async () => {
    const Element = await setup();
    const el = new Element({ 'value-type': 'object', 'get-value-type': 'text', 'set-value-type': 'text',
        'value-prefix': 'shared:', 'get-value-prefix': 'get:', 'set-value-prefix': 'set:' });
    el.setValue('hello');
    assert.equal(el.value, 'set:hello');
    assert.equal(el.getValue(), 'get:set:hello');
    assert.equal(await el.getValueAsync(), 'get:set:hello');
});

function option(Element, value, attributes = {}) {
    const el = new Element(attributes, 'OPTION');
    el.value = value;
    return el;
}

test('single select preserves unset and reads boolean types from selected options', async () => {
    const Element = await setup();
    const select = new Element({}, 'SELECT');
    for (const [value, attributes, expected] of [
        ['', {}, ''], ['true', { 'value-type': 'boolean' }, true],
        ['false', { 'value-type': 'boolean' }, false], ['false', {}, 'false']
    ]) {
        select.selectedOptions = [option(Element, value, attributes)];
        assert.equal(select.getValue(), expected);
        assert.equal(await select.getValueAsync(), expected);
    }
});

test('multiple select preserves individually processed types and empty options', async () => {
    const Element = await setup();
    const select = new Element({ multiple: '' }, 'SELECT');
    select.selectedOptions = [
        option(Element, '', {}),
        option(Element, 'false', { 'value-type': 'boolean' }),
        option(Element, '{"id":1}', { 'value-type': 'json' }),
        option(Element, 'hello', { 'get-value-uppercase': '' })
    ];
    for (const value of [select.getValue(), await select.getValueAsync()]) {
        assert.equal(JSON.stringify(value), JSON.stringify(['', false, { id: 1 }, 'HELLO']));
    }
});

test('select transformations still run after option transformations', async () => {
    const Element = await setup();
    const select = new Element({ 'get-value-prefix': '[', 'get-value-suffix': ']' }, 'SELECT');
    select.selectedOptions = [option(Element, 'hello', { 'get-value-uppercase': '' })];
    assert.equal(select.getValue(), '[HELLO]');
    assert.equal(await select.getValueAsync(), '[HELLO]');
    const multiple = new Element({ multiple: '', 'value-prefix': '[', 'value-suffix': ']' }, 'SELECT');
    multiple.selectedOptions = select.selectedOptions;
    assert.deepEqual(Array.from(multiple.getValue()), ['[HELLO]']);
    assert.deepEqual(Array.from(await multiple.getValueAsync()), ['[HELLO]']);
    const booleanSelect = new Element({ 'value-type': 'boolean' }, 'SELECT');
    booleanSelect.selectedOptions = [option(Element, 'false')];
    assert.equal(booleanSelect.getValue(), false);
    assert.equal(await booleanSelect.getValueAsync(), false);
});

test('selects with no selected options return an empty string or array', async () => {
    const Element = await setup();
    for (const attributes of [{}, { multiple: '' }]) {
        const select = new Element(attributes, 'SELECT');
        select.selectedOptions = [];
        const expected = 'multiple' in attributes ? '[]' : '""';
        assert.equal(JSON.stringify(select.getValue()), expected);
        assert.equal(JSON.stringify(await select.getValueAsync()), expected);
    }
});

test('explicit setter prefix and suffix build the rendered value', async () => {
    const Element = await setup();
    const el = new Element({'set-value-prefix':'/assets/images/providers/', 'set-value-suffix':'.svg'});
    el.setValue('aws');
    assert.equal(el.value, '/assets/images/providers/aws.svg');
});

test('iframes honor explicit src and srcdoc setter paths', async () => {
    const Element = await setup();
    const srcFrame = new Element({ src: '' }, 'IFRAME');
    const srcdocFrame = new Element({ srcdoc: '' }, 'IFRAME');

    srcFrame.setValue('/assets/files/preview.html');
    srcdocFrame.setValue('<h1>Preview</h1>');

    assert.equal(srcFrame.src, '/assets/files/preview.html');
    assert.equal(srcFrame.srcdoc, undefined);
    assert.equal(srcdocFrame.src, undefined);
    assert.equal(srcdocFrame.srcdoc, '<h1>Preview</h1>');
});

test('shared affixes retain the existing get/set round trip', async () => {
    const Element = await setup();
    const el = new Element({'value-prefix':'[', 'value-suffix':']'});
    el.setValue('[aws]');
    assert.equal(el.value, 'aws');
    assert.equal(el.getValue(), '[aws]');
});
test('empty setter affixes override shared affixes', async () => {
    const Element = await setup();
    const el = new Element({'value-prefix':'[', 'value-suffix':']', 'set-value-prefix':'', 'set-value-suffix':''});
    el.setValue('[aws]');
    assert.equal(el.value, '[aws]');
});

test('generic values prefer attributes then properties while explicit reads select the DOM', async () => {
    const Element = await setup();
    const el = new Element({ value: '' }, 'DIV');
    el.value = 'property';
    el.innerHTML = '<b>markup</b>';
    el.textContent = 'markup';
    assert.equal(el.getValue(), '');
    assert.equal(await el.getValueAsync(), '');
    assert.equal(el.getValue('textContent'), 'markup');
    assert.equal(await el.getValueAsync('innerHTML'), '<b>markup</b>');
    el.attributes.splice(0);
    el.value = '';
    assert.equal(el.getValue(), '');
    delete el.value;
    assert.equal(el.getValue(), '<b>markup</b>');
});

test('component values stay on the element across repeated asynchronous reads', async () => {
    const Element = await setup();
    const el = new Element({ component: '' }, 'DIV'), value = { source: 'stored' };
    el.setValue(value);
    assert.equal(el.value, value);
    assert.equal(await el.getValueAsync(), value);
    assert.equal(await el.getValueAsync(), value);
    assert.equal(el.getValue(), value);
});

test('component and editor markers do not bypass native checkbox handling', async () => {
    const Element = await setup();
    for (const marker of ['component', 'editor', 'language']) {
        const el = new Element({ [marker]: '', value: 'yes' }, 'INPUT');
        el.type = 'checkbox';
        el.value = 'yes';
        el.setValue(true);
        assert.equal(el.checked, true);
        assert.equal(el.value, 'yes');
        el.setValue(false);
        assert.equal(el.checked, false);
        assert.equal(el.getValue(), false);
    }
});

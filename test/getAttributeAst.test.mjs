import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = {
	innerWidth: 1024,
	innerHeight: 768,
	location: {
		href: "https://example.test/",
		origin: "https://example.test",
		protocol: "https:",
		hostname: "example.test",
		host: "example.test",
		port: "",
		pathname: "/",
		hash: ""
	},
	addEventListener() {}
};
globalThis.localStorage = { getItem: () => null };

class TestElement {
	constructor(attributes, value) {
		this.attributes = new Map(Object.entries(attributes));
		this.value = value;
	}

	getAttribute(name) {
		return this.attributes.has(name) ? this.attributes.get(name) : null;
	}

	getValue() {
		return this.value;
	}
}

globalThis.Element = TestElement;

const { getAttribute, getAttributeAsync } = await import("../src/getAttribute.js");

const labelExpression = JSON.stringify({
	parsed: { $parse: "$value" },
	$return: {
		$if: {
			$parsed: {
				$eq: {
					$true: "Enabled",
					$false: "Disabled",
					"true": "Enabled",
					"false": "Disabled",
					Enabled: "Enabled",
					Disabled: "Disabled",
					$else: ""
				}
			}
		}
	}
});

const directStringLabelExpression = JSON.stringify({
	$if: {
		$value: {
			$eq: {
				"true": "Enabled",
				"false": "Disabled",
				$else: ""
			}
		}
	}
});

test("input.value evaluates direct string equality branches", async () => {
	for (const [value, expected] of [["true", "Enabled"], ["false", "Disabled"]]) {
		const element = new TestElement({ "input.value": directStringLabelExpression }, value);

		assert.equal(getAttribute(element, "input.value"), expected);
		assert.equal(await getAttributeAsync(element, "input.value"), expected);
	}
});

test("client getAttribute resolves $value from the element and maps it through AST", async () => {
	for (const [value, expected] of [
		[true, "Enabled"],
		[false, "Disabled"],
		["true", "Enabled"],
		["false", "Disabled"],
		["Enabled", "Enabled"],
		["Disabled", "Disabled"]
	]) {
		const element = new TestElement({ "input.value": labelExpression }, value);

		assert.equal(getAttribute(element, "input.value"), expected);
		assert.equal(await getAttributeAsync(element, "input.value"), expected);
	}
});

/********************************************************************************
 * Copyright (C) 2026 CoCreate and Contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 ********************************************************************************/

import { astSync, astAsync } from "@cocreate/utils";

const storage = new Map();

HTMLElement.prototype.getValue = function () {
	return getValue(this);
};
SVGElement.prototype.getValue = function () {
	return getValue(this);
};

HTMLElement.prototype.getValueAsync = async function () {
	return await getValueAsync(this);
};
SVGElement.prototype.getValueAsync = async function () {
	return await getValueAsync(this);
};

/**
 * Retrieves and processes the value from an HTML element synchronously.
 *
 * @param {HTMLElement} element - The HTML element to process for its value.
 * @param {string} valueType - Optional. The expected type that defines how the value should be processed.
 * @returns {any} - The processed value.
 */
const getValue = (element, valueType) => {
	if (!valueType) {
		valueType = element.getAttribute("value-type") || "";
	}

	let value = element.value || element.getAttribute("value") || "";

	if (
		element.hasAttribute("component") ||
		element.type === "file" ||
		element.getAttribute("type") === "file"
	) {
		value = storage.get(element);
		storage.delete(element);
		return value;
	}

	let prefix = element.getAttribute("value-prefix") || "";
	let suffix = element.getAttribute("value-suffix") || "";

	const elementType = element.getAttribute("type") || element.type;
	const tagName = element.tagName.toUpperCase();

	switch (elementType) {
		case "checkbox":
			value = handleCheckbox(element, prefix, suffix);
			break;

		case "radio": {
			const key = element.getAttribute("key");
			let el = document.querySelector(`input[key="${key}"]:checked`);
			if (el) {
				value = el.value;
			}
			break;
		}

		case "number":
			value = Number(value);
			break;

		case "range":
			value = element.min
				? [Number(element.min), Number(element.value)]
				: Number(element.value);
			break;

		case "password":
			value = btoa(value || "");
			break;

		case "email":
			value = value.toLowerCase();
			break;

		case "url":
			break;

		case "time":
		case "date":
		case "datetime":
		case "datetime-local":
			value = handleDateTime(element, value, valueType);
			break;

		default:
			switch (tagName) {
				case "INPUT":
					value = element.value;
					break;

				case "SELECT":
					value = element.hasAttribute("multiple")
						? handleMultipleSelect(element, prefix, suffix)
						: element.value;
					break;

				case "TEXTAREA":
					value = element.hasAttribute("value")
						? element.getAttribute("value")
						: element.value;
					break;

				case "IFRAME":
					value = element.srcdoc;
					break;

				default:
					value = handleElement(element, valueType);
					break;
			}
			break;
	}

	if (valueType === "boolean") {
		return value && value !== "false";
	}

	if (value) {
		value = astSync({ executeAST: value, node: element, exclude: ["$value"] });
		value = caseHandler(element, value);
		value = regex(element, value);
		value = encodeValue(value, element.getAttribute("value-encode") || "");
		value = decodeValue(value, element.getAttribute("value-decode") || "");
	}

	if (typeof value === "string" || typeof value === "number") {
		if (prefix || suffix) {
			value = prefix + value + suffix;
		}
	}

	value = parseJson(value, valueType);
	value = toArray(value, valueType);

	return value;
};

/**
 * Retrieves and processes the value from an HTML element asynchronously.
 *
 * @param {HTMLElement} element - The HTML element to process for its value.
 * @param {string} valueType - Optional. The expected type that defines how the value should be processed.
 * @returns {Promise<any>} - A promise that resolves to the processed value.
 */
const getValueAsync = async (element, valueType) => {
	if (!valueType) {
		valueType = element.getAttribute("value-type") || "";
	}

	let value = element.value || element.getAttribute("value") || "";

	if (
		element.hasAttribute("component") ||
		element.type === "file" ||
		element.getAttribute("type") === "file"
	) {
		value = storage.get(element);
		storage.delete(element);
		return value;
	}

	let prefix = element.getAttribute("value-prefix") || "";
	let suffix = element.getAttribute("value-suffix") || "";

	const elementType = element.getAttribute("type") || element.type;
	const tagName = element.tagName.toUpperCase();

	switch (elementType) {
		case "checkbox":
			value = handleCheckbox(element, prefix, suffix);
			break;

		case "radio": {
			const key = element.getAttribute("key");
			let el = document.querySelector(`input[key="${key}"]:checked`);
			if (el) {
				value = el.value;
			}
			break;
		}

		case "number":
			value = Number(value);
			break;

		case "range":
			value = element.min
				? [Number(element.min), Number(element.value)]
				: Number(element.value);
			break;

		case "password":
			value = btoa(value || "");
			break;

		case "email":
			value = value.toLowerCase();
			break;

		case "url":
			break;

		case "time":
		case "date":
		case "datetime":
		case "datetime-local":
			value = handleDateTime(element, value, valueType);
			break;

		default:
			switch (tagName) {
				case "INPUT":
					value = element.value;
					break;

				case "SELECT":
					value = element.hasAttribute("multiple")
						? handleMultipleSelect(element, prefix, suffix)
						: element.value;
					break;

				case "TEXTAREA":
					value = element.hasAttribute("value")
						? element.getAttribute("value")
						: element.value;
					break;

				case "IFRAME":
					value = element.srcdoc;
					break;

				default:
					value = handleElement(element, valueType);
					break;
			}
			break;
	}

	if (valueType === "boolean") {
		return value && value !== "false";
	}

	if (value) {
		value = await astAsync({ executeAST: value, node: element, exclude: ["$value"] });
		value = caseHandler(element, value);
		value = regex(element, value);
		value = encodeValue(value, element.getAttribute("value-encode") || "");
		value = decodeValue(value, element.getAttribute("value-decode") || "");
	}

	if (typeof value === "string" || typeof value === "number") {
		if (prefix || suffix) {
			value = prefix + value + suffix;
		}
	}

	value = parseJson(value, valueType);
	value = toArray(value, valueType);

	return value;
};

/**
 * Processes a checkbox or a group of checkboxes to determine their checked values.
 */
const handleCheckbox = (element, prefix = "", suffix = "") => {
	const inputs = element.getAttribute("key")
		? document.querySelectorAll(
				`input[type="${element.type}"][key="${element.getAttribute(
					"key"
				)}"]`
		  )
		: [element];

	if (inputs.length === 1) {
		return element.checked ? element.value || true : false;
	} else {
		return Array.from(inputs)
			.filter((el) => el.checked)
			.map((el) => `${prefix}${el.value}${suffix}`);
	}
};

/**
 * Handles and transforms a date/time value based on the specified valueType.
 */
const handleDateTime = (element, value, valueType) => {
    const inputType = (element.getAttribute("type") || element.type || "").toLowerCase();
    let date;
    
    if (value === "$now" || element.hasAttribute("now")) {
        date = new Date();
    } else if (value instanceof Date) {
        date = new Date(value.getTime());
    } else if (value) {
        if (
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(
                value
            )
        ) {
            if (inputType === "datetime-local" && /^[0-9T:-]{16}$/.test(value)) {
                value = `${value}:00`;
            }
            date = new Date(value);
        } else {
            date = new Date(value);
        }
    } else {
        console.warn("Provided date is invalid:", value);
        return "";
    }

    if (date instanceof Date && !isNaN(date.getTime())) {
        switch (valueType) {
            case "startOfDay":
                date.setHours(0, 0, 0, 0);
                break;
            case "startOfWeek": {
                const startWkOff = parseInt(
                    element.getAttribute("week-start-day") || 0,
                    10
                );
                date.setDate(date.getDate() - date.getDay() + startWkOff);
                date.setHours(0, 0, 0, 0);
                break;
            }
            case "endOfWeek": {
                const endWkOff = parseInt(
                    element.getAttribute("week-start-day") || 0,
                    10
                );
                date.setDate(date.getDate() - date.getDay() + 6 + endWkOff);
                date.setHours(23, 59, 59, 999);
                break;
            }
            case "startOfMonth":
                date.setDate(1);
                date.setHours(0, 0, 0, 0);
                break;
            case "endOfMonth":
                date.setMonth(date.getMonth() + 1, 0);
                date.setHours(23, 59, 59, 999);
                break;
            case "startOfYear":
                date.setMonth(0, 1);
                date.setHours(0, 0, 0, 0);
                break;
            case "endOfYear":
                date.setMonth(11, 31);
                date.setHours(23, 59, 59, 999);
                break;
        }

        const getVal = (attr) =>
            parseInt(element.getAttribute(attr) || "0", 10);

        const addYears = getVal("add-years") - getVal("subtract-years");
        if (addYears) date.setFullYear(date.getFullYear() + addYears);

        const addMonths = getVal("add-months") - getVal("subtract-months");
        if (addMonths) date.setMonth(date.getMonth() + addMonths);

        const addWeeks = getVal("add-weeks") - getVal("subtract-weeks");
        if (addWeeks) date.setDate(date.getDate() + addWeeks * 7);

        const addDays = getVal("add-days") - getVal("subtract-days");
        if (addDays) date.setDate(date.getDate() + addDays);

        const addHours = getVal("add-hours") - getVal("subtract-hours");
        if (addHours) date.setHours(date.getHours() + addHours);

        const addMinutes = getVal("add-minutes") - getVal("subtract-minutes");
        if (addMinutes) date.setMinutes(date.getMinutes() + addMinutes);

        const addSeconds = getVal("add-seconds") - getVal("subtract-seconds");
        if (addSeconds) date.setSeconds(date.getSeconds() + addSeconds);

        switch (valueType) {
            case "getDayName": {
                const days = [
                    "Sunday", "Monday", "Tuesday", "Wednesday",
                    "Thursday", "Friday", "Saturday",
                ];
                return days[date.getDay()];
            }

            case "getMonthName": {
                const months = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December",
                ];
                return months[date.getMonth()];
            }

            case "getYear":
            case "getFullYear":
                return date.getFullYear();

            case "getTime": {
                let hours = date.getHours();
                const minutes = String(date.getMinutes()).padStart(2, "0");
                const ampm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12 || 12;
                return `${hours}:${minutes} ${ampm}`;
            }

            case "timeTo": {
                const diffMs = date.getTime() - Date.now();
                let totalSeconds = Math.floor(Math.abs(diffMs) / 1000);

                const unitsAttr = element.getAttribute("time-to-units") || "years,months,days,hours,minutes,seconds";
                const requestedUnits = unitsAttr.split(',').map(u => u.trim().toLowerCase());

                const result = {};

                const unitValues = {
                    years: 31536000,
                    months: 2592000,
                    weeks: 604800,
                    days: 86400,
                    hours: 3600,
                    minutes: 60,
                    seconds: 1
                };

                const order = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];

                for (const unit of order) {
                    if (requestedUnits.includes(unit)) {
                        const val = Math.floor(totalSeconds / unitValues[unit]);
                        result[unit] = val;
                        totalSeconds -= val * unitValues[unit];
                    }
                }

                return result;
            }

            case "timeAgo": {
                const diffMs = Date.now() - date.getTime();
                const absSecs = Math.floor(Math.abs(diffMs) / 1000);
                
                const limitAttr = element.getAttribute("time-ago-limit");
                if (limitAttr) {
                    const match = limitAttr.match(/^(\d+)([a-z]+)$/i);
                    if (match) {
                        const amount = parseInt(match[1], 10);
                        const limitUnit = match[2].toLowerCase();
                        let multiplier = 0;
                        
                        switch (limitUnit) {
                            case 's': multiplier = 1; break;
                            case 'm': multiplier = 60; break;
                            case 'h': multiplier = 3600; break;
                            case 'd': multiplier = 86400; break;
                            case 'w': multiplier = 604800; break;
                            case 'mo': multiplier = 2592000; break;
                            case 'y': multiplier = 31536000; break;
                        }
                        
                        const limitInSeconds = amount * multiplier;
                        
                        if (absSecs > limitInSeconds) {
                            const locale = element.getAttribute("locale") || "en-US";
                            return date.toLocaleString(locale);
                        }
                    }
                }

                let value, unit;
                if (absSecs < 60) { value = absSecs; unit = 'second'; }
                else if (absSecs < 3600) { value = Math.floor(absSecs / 60); unit = 'minute'; }
                else if (absSecs < 86400) { value = Math.floor(absSecs / 3600); unit = 'hour'; }
                else if (absSecs < 604800) { value = Math.floor(absSecs / 86400); unit = 'day'; }
                else if (absSecs < 2592000) { value = Math.floor(absSecs / 604800); unit = 'week'; }
                else if (absSecs < 31536000) { value = Math.floor(absSecs / 2592000); unit = 'month'; }
                else { value = Math.floor(absSecs / 31536000); unit = 'year'; }

                const plural = value !== 1 ? 's' : '';
                return `${value} ${unit}${plural}`;
            }

            case "toUnixTimestamp":
                return Math.floor(date.getTime() / 1000);

            case "toLocaleString": {
                const locale = element.getAttribute("locale") || "en-US";
                return date.toLocaleString(locale);
            }

            default:
                if (valueType && typeof date[valueType] === "function") {
                    return date[valueType]();
                }

                const pad = (n) => String(n).padStart(2, "0");
                if (inputType === "datetime-local") {
                    return `${date.getFullYear()}-${pad(
                        date.getMonth() + 1
                    )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
                        date.getMinutes()
                    )}:${pad(date.getSeconds())}`;
                }
                return date.toISOString();
        }
    }
};

/**
 * Processes a <select> element with the "multiple" attribute.
 */
const handleMultipleSelect = (element, prefix, suffix) => {
	let value = [];
	let options = element.selectedOptions;

	for (let i = 0; i < options.length; i++) {
		let optionValue = options[i].value;
		if (prefix || suffix) {
			optionValue = prefix + optionValue + suffix;
		}
		value.push(optionValue);
	}

	return value;
};

/**
 * Retrieves a value from a standard element.
 */
const handleElement = (element, valueType) => {
	if (element.hasAttribute("value")) {
		return element.getAttribute("value");
	}

	let targetElement = element;
	const excludeSelector = element.getAttribute("value-remove-query");

	if (excludeSelector) {
		targetElement = element.cloneNode(true);
		targetElement
			.querySelectorAll(excludeSelector)
			.forEach((el) => el.remove());
	}

	switch (valueType) {
		case "text":
			return targetElement.innerText;
		case "outerHTML":
		case "element":
		case "node":
			return targetElement.outerHTML;
		default:
			return targetElement.innerHTML;
	}
};

/**
 * Adjusts casing transformations on attributes.
 */
function caseHandler(element, value) {
	const lowercase = element.getAttribute("value-lowercase");
	if (lowercase !== null && lowercase !== "false") {
		value = value.toLowerCase();
	}

	const uppercase = element.getAttribute("value-uppercase");
	if (uppercase !== null && uppercase !== "false") {
		value = value.toUpperCase();
	}

	return value;
}

/**
 * Transforms output based on Regular Expression definitions.
 */
function regex(element, value) {
	try {
		const attributes = element.attributes;
		const regexAttribute = [
			"value-replace",
			"value-replaceall",
			"value-test",
			"value-match",
			"value-split",
			"value-lastindex",
			"value-search",
			"value-exec"
		];

		for (let i = 0; i < attributes.length; i++) {
			if (value === null || value === undefined) break;
			if (!regexAttribute.includes(attributes[i].name)) continue;

			let regexAttributeValue = attributes[i].value;
			if (!regexAttributeValue) continue;

			let { regex, replacement } = regexParser(regexAttributeValue);
			if (regex) regexAttributeValue = regex;

			replacement =
				replacement || element.getAttribute("value-replacement") || "";

			switch (attributes[i].name) {
				case "value-replace":
					value = value.replace(regexAttributeValue, replacement);
					break;
				case "value-replaceall":
					value = value.replaceAll(regexAttributeValue, replacement);
					break;
				case "value-test":
					value = regex.test(value);
					break;
				case "value-match": {
					const matches = value.match(regexAttributeValue);
					if (matches) {
						value = matches[1] || matches[0];
					}
					break;
				}
				case "value-split":
					value = value.split(regexAttributeValue);
					break;
				case "value-lastindex":
					regex.lastIndex = 0;
					regex.test(value);
					value = regex.lastIndex;
					break;
				case "value-search":
					value = value.search(regexAttributeValue);
					break;
				case "value-exec": {
					const execResult = regex.exec(value);
					if (execResult) {
						value = execResult[1] || execResult[2] || execResult[0];
					}
					break;
				}
			}
		}

		return value;
	} catch (error) {
		console.warn(
			"Warning: Transformation error during regex operation:",
			error,
			element
		);
		return value;
	}
}

function regexParser(string) {
	let regex, replacement;
	let regexMatch = string.match(/\/(.+)\/([gimuy]*)/);

	if (regexMatch) {
		regex = new RegExp(regexMatch[1], regexMatch[2]);
		const splitReplace = string.split(", ");
		replacement =
			splitReplace.length > 1 ? splitReplace[1].slice(1, -1) : "";
	}

	return { regex, replacement };
}

/**
 * Encodes calculated structures securely.
 */
function encodeValue(value, encodingType) {
	if (!encodingType) {
		return value;
	}

	switch (encodingType.toLowerCase()) {
		case "url":
		case "uri":
			return encodeURI(value.replace(/ /g, "%20"));

		case "uri-component":
			return encodeURIComponent(value.replace(/ /g, "%20"));

		case "base64":
		case "atob":
			try {
				const encoder = new TextEncoder();
				const uint8Array = encoder.encode(value);
				return btoa(String.fromCharCode(...uint8Array));
			} catch (error) {
				console.warn(`Failed to encode as Base64: ${error.message}`);
				return value;
			}

		case "html-entities":
			return value.replace(/[\u00A0-\u9999<>\&]/g, (i) => {
				return `&#${i.charCodeAt(0)};`;
			});

		case "json":
			try {
				return JSON.stringify(value);
			} catch (error) {
				console.warn(`Failed to convert to JSON: ${error.message}`);
				return value;
			}

		default:
			console.warn(`Unsupported encoding type: ${encodingType}`);
			return value;
	}
}

/**
 * Decodes calculated structures securely.
 */
function decodeValue(value, decodingType) {
	if (!decodingType) {
		return value;
	}

	switch (decodingType.toLowerCase()) {
		case "url":
		case "uri":
			return decodeURI(value);

		case "uri-component":
			return decodeURIComponent(value);

		case "base64":
		case "btoa":
			try {
				const decodedArray = Uint8Array.from(atob(value), (c) =>
					c.charCodeAt(0)
				);
				const decoder = new TextDecoder();
				return decoder.decode(decodedArray);
			} catch (error) {
				console.warn(`Failed to decode Base64: ${error.message}`);
				return value;
			}

		case "html-entities": {
			const tempElement = document.createElement("div");
			tempElement.innerHTML = value;
			return tempElement.textContent;
		}

		case "json":
			try {
				return JSON.parse(value);
			} catch (error) {
				console.warn(`Failed to parse JSON: ${error.message}`);
				return value;
			}

		default:
			console.warn(`Unsupported decoding type: ${decodingType}`);
			return value;
	}
}

function parseJson(value, valueType) {
	if (
		value &&
		(valueType === "object" ||
			valueType === "json" ||
			valueType.startsWith("array"))
	) {
		try {
			value = JSON.parse(value);
		} catch {
			const jsonRegex = /(\{[\s\S]*}|\[[\s\S]*\])/;
			const match = value.match(jsonRegex);

			if (match) {
				try {
					value = JSON.parse(match[0]);
				} catch {
					console.warn(
						"Warning: Failed to parse JSON after extraction. Returning original value."
					);
				}
			} else {
				console.warn(
					"Warning: No valid JSON structure found in the string. Returning original value."
				);
			}
		}
	}
	return value;
}

function toArray(value, valueType) {
	if (valueType.startsWith("array")) {
		if (!Array.isArray(value)) {
			if (typeof value === "object" && value !== null) {
				if (valueType === "array.$keys") {
					value = Object.keys(value);
				} else if (valueType === "array.$values") {
					value = Object.values(value);
				} else if (valueType === "array.$entries") {
					value = Object.entries(value);
				} else {
					value = [value];
				}
			} else {
				value = [value];
			}
		}
	}
	return value;
}

export { getValue, getValueAsync, storage };
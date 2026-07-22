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

// Store a reference to the original native getAttribute function
const originalGetAttribute = Element.prototype.getAttribute;

// Map to store attribute binding details for dynamic storage syncs
const attributes = new Map();

if (typeof window !== "undefined") {
    // Add an event listener for storage changes to update local attributes dynamically
    window.addEventListener("storage", updateAttributes);
    
    // Custom event bridge to update attributes from script environments
    window.addEventListener("updateAttributes", function (e) {
        updateAttributes(e.detail);
    });
}

/**
 * Function to update attributes on registered elements based on specific storage keys
 * @param {Object} e - The event object containing changed key and newValue
 */
function updateAttributes(e) {
    if (!e) return;
    const keys = ["organization_id", "user_id", "clientId", "session_id"];
    if (keys.includes(e.key)) {
        let attr = attributes.get(e.key) || [];
        for (let attribute of attr) {
            if (attribute && attribute.element) {
                attribute.element.setAttribute(attribute.name, e.newValue);
            }
        }
    }
}

/**
 * Custom getAttribute function that processes the attribute value synchronously
 * @param {Element} element - The element from which to get the attribute
 * @param {string} name - The attribute name
 * @returns {string|any} - The processed attribute value
 */
function getAttribute(element, name) {
    if (!(element instanceof Element)) {
        throw new Error("First argument must be an Element");
    }
    
    const value = originalGetAttribute.call(element, name);
    if (!value || typeof value !== "string") {
        return value;
    }
    
    // Evaluate formulas or step paths synchronously via the unified AST Engine
    return astSync({ executeAST: value, node: element });
}

/**
 * Asynchronously gets an attribute and processes its value through our async AST pipelines.
 * @param {Element} element - The element from which to get the attribute.
 * @param {string} name - The attribute name.
 * @returns {Promise<string|any>} - A promise that resolves to the processed attribute value.
 */
async function getAttributeAsync(element, name) {
    if (!(element instanceof Element)) {
        throw new Error("First argument must be an Element");
    }
    
    const value = originalGetAttribute.call(element, name);
    if (!value || typeof value !== "string") {
        return value;
    }
    
    // Evaluate async formulas, database lookups, or template blocks asynchronously
    return await astAsync({ executeAST: value, node: element });
}

// Override the native getAttribute method on the global Element prototype
Element.prototype.getAttribute = function (name) {
    return getAttribute(this, name);
};

// Add getAttributeAsync directly to the global Element prototype
Element.prototype.getAttributeAsync = function (name) {
    return getAttributeAsync(this, name);
};

// Export the customized attribute getters
export { getAttribute, getAttributeAsync };
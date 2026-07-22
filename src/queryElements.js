import { queryElements as baseQueryElements } from "@cocreate/utils";

/**
 * Custom method to query elements in the context of a specific DOM element.
 *
 * @this {Element} - The DOM element context.
 * @param {Object} [options={}] - Options to customize the query.
 * @returns {NodeListOf<Element>} A list of elements found based on the query criteria.
 */
export function queryElements(options = {}) {
    // Ensure 'this' is a valid Element when used as a prototype method
    if (!(this instanceof Element)) {
        throw new TypeError("queryElements must be called on an Element instance");
    }

    return baseQueryElements({ element: this, ...options });
}

// Attach the method to Element's prototype for instance method usage
if (!Element.prototype.queryElements) {
    Element.prototype.queryElements = queryElements;
}
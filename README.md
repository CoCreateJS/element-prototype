# CoCreate-element-prototype

A simple element-prototype component in vanilla javascript. Easily configured using HTML5 data-attributes and/or JavaScript API. Take it for a spin in our [playground!](https://cocreate.app/docs/element-prototype)

![min file size in bytes](https://img.badgesize.io/https://cdn.cocreate.app/element-prototype/latest/CoCreate-element-prototype.min.js?style=flat-square&label=minified&color=orange)
![gzip file size in bytes](https://img.badgesize.io/https://cdn.cocreate.app/element-prototype/latest/CoCreate-element-prototype.min.js?compression=gzip&style=flat-square&label=gzip&color=yellow)
![brotlifile size in bytes](https://img.badgesize.io/https://cdn.cocreate.app/element-prototype/latest/CoCreate-element-prototype.min.js?compression=brotli&style=flat-square&label=brotli)
![GitHub latest release](https://img.shields.io/github/v/release/CoCreate-app/CoCreate-element-prototype?style=flat-square)
![GitHub](https://img.shields.io/github/license/CoCreate-app/CoCreate-element-prototype?style=flat-square)
![GitHub](https://img.shields.io/static/v1?style=flat-square&label=&message=Hiring&color=blueviolet)

![CoCreate-element-prototype](https://cdn.cocreate.app/docs/CoCreate-element-prototype.gif)

## [Docs & Demo](https://cocreate.app/docs/element-prototype)

For a complete guide and working demo refer to the [doumentation](https://cocreate.app/docs/element-prototype)

## Value transformations

Value transformations accept three attribute namespaces:

- `value-*` applies to both reads and writes.
- `get-value-*` applies to `getValue()` and `getValueAsync()`.
- `set-value-*` applies to `setValue()`.

Each direction-specific attribute overrides its corresponding shared attribute,
regardless of attribute order. Other options still fall back independently.
For example, `value-uppercase` with `set-value-uppercase="false"` uppercases
only reads. An empty scoped regex/encoding attribute disables that operation;
`"false"` also disables case, regex, and encoding/decoding transformations.
An empty case attribute enables case conversion.

Supported transformation suffixes include `lowercase`, `uppercase`, `replace`,
`replaceall`, `replacement`, `test`, `match`, `split`, `lastindex`, `search`,
`exec`, `encode`, and `decode`. The `type` suffix supports `boolean`, `object`,
`json`, `array`, `array.$keys`, `array.$values`, and `array.$entries`, as well as
existing element read/render types. `prefix` and `suffix` also honor scoped
overrides, retaining their existing add-on-read and strip-on-write behavior.

Setter transformations run in this order: case, regex operations (in effective
attribute order), encoding, decoding, and type conversion. They run before
component storage or element rendering. Components retain structured values;
textareas serialize objects and arrays as JSON.

```html
<textarea value-uppercase></textarea>
<textarea get-value-encode="base64" set-value-decode="base64"></textarea>
<div component set-value-type="object"></div>
```

Calling `setValue('{"enabled":true}')` on the component above stores an object;
its `getValue()` returns that object. Use scoped attributes for transformations
that should happen only once: unscoped replacements or encoding can run again
when reading a value that was previously written.

## CDN

```html
<script src="https://cdn.cocreate.app/element-prototype/latest/CoCreate-element-prototype.min.js"></script>
```

```html
<script src="https://cdn.cocreate.app/element-prototype/latest/CoCreate-element-prototype.min.css"></script>
```

## NPM

```shell
$ npm i @cocreate/element-prototype
```

## yarn

```shell
$ yarn install @cocreate/element-prototype
```

# Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Announcements](#announcements)
-   [Roadmap](#roadmap)
-   [How to Contribute](#how-to-contribute)
-   [About](#about)
-   [License](#license)

<a name="announcements"></a>

# Announcements

All updates to this library are documented in our [CHANGELOG](https://github.com/CoCreate-app/CoCreate-element-prototype/blob/master/CHANGELOG.md) and [releases](https://github.com/CoCreate-app/CoCreate-element-prototype/releases). You may also subscribe to email for releases and breaking changes.

<a name="roadmap"></a>

# Roadmap

If you are interested in the future direction of this project, please take a look at our open [issues](https://github.com/CoCreate-app/CoCreate-element-prototype/issues) and [pull requests](https://github.com/CoCreate-app/CoCreate-element-prototype/pulls). We would love to hear your feedback.

<a name="about"></a>

# About

CoCreate-element-prototype is guided and supported by the CoCreate Developer Experience Team.

Please Email the Developer Experience Team [here](mailto:develop@cocreate.app) in case of any queries.

CoCreate-element-prototype is maintained and funded by CoCreate. The names and logos for CoCreate are trademarks of CoCreate, LLC.

<a name="contribute"></a>

# How to Contribute

We encourage contribution to our libraries (you might even score some nifty swag), please see our [CONTRIBUTING](https://github.com/CoCreate-app/CoCreate-element-prototype/blob/master/CONTRIBUTING.md) guide for details.

We want this library to be community-driven, and CoCreate led. We need your help to realize this goal. To help make sure we are building the right things in the right order, we ask that you create [issues](https://github.com/CoCreate-app/CoCreate-element-prototype/issues) and [pull requests](https://github.com/CoCreate-app/CoCreate-element-prototype/pulls) or merely upvote or comment on existing issues or pull requests.

We appreciate your continued support, thank you!

<a name="license"></a>

# License

This software is dual-licensed under the GNU Affero General Public License version 3 (AGPLv3) and a commercial license.

-   **Open Source Use**: For open-source projects and non-commercial use, this software is available under the AGPLv3. The AGPLv3 allows you to freely use, modify, and distribute this software, provided that all modifications and derivative works are also licensed under the AGPLv3. For the full license text, see the [LICENSE file](https://github.com/CoCreate-app/CoCreate-element-prototype/blob/master/LICENSE).

-   **Commercial Use**: For-profit companies and individuals intending to use this software for commercial purposes must obtain a commercial license. The commercial license is available when you sign up for an API key on our [website](https://cocreate.app). This license permits proprietary use and modification of the software without the copyleft requirements of the AGPLv3. It is ideal for integrating this software into proprietary commercial products and applications.

If you have not purchased a commercial license and intend to use this software for commercial purposes, you are required to sign up for an API key on our website.

### Values on select options

Select getters process each selected option through the corresponding synchronous
or asynchronous value getter before applying the select's own transformations.
A single select returns one processed value; `multiple` returns an array.

```html
<select>
    <option value="">Any state</option>
    <option value="true" value-type="boolean">Enabled</option>
    <option value="false" value-type="boolean">Disabled</option>
</select>
```

Here the values are `""`, `true`, and `false`. Types and transformations declared
on options affect only those options. Existing select-level types still apply
to the collected result; select-level prefixes and suffixes still apply to each
value in a multiple select. With no selected option, the result is `""` for a
single select or `[]` for a multiple select, before select-level transformations.

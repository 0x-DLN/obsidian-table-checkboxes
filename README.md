# Obsidian Tables Checkboxes
This plugin for [Obsidian](https://obsidian.md) replaces markdown checkboxes `-[]` inside markdown tables with HTML checkboxes.

## Known Issues

These issues will eventually be worked on. For now, try these known workarounds. The project is open to Pull Requests, you can also contribute by providing helpful information on GitHub.

### Markdown to HTML Checkbox Conversion not Working

[GitHub Issue](https://github.com/DylanGiesberts/obsidian-table-checkboxes/issues/11)

Manually typed checkboxes `- [ ] ` might not be converted to their HTML equivalent.

Workaround:
Paste the string below in the cell you want to add the checkbox to and make sure to replace `YOUR_ID_HERE` with a random, unique number (for example increasing integers).

```html
<input type="checkbox" unchecked id="YOUR_ID_HERE">
```

### Checkboxes Show as HTML when Togelling in Preview Mode

[GitHub Issue](https://github.com/DylanGiesberts/obsidian-table-checkboxes/issues/15)

When trying to check/uncheck a checkbox in Preview Mode, the HTML code for the checkbox shows up instead of toggeling the checkbox state.

Workaround:
Open the note in Reading Mode. Checking/unchecking should work fine now.

## Example
https://github.com/DylanGiesberts/obsidian-table-checkboxes/assets/66573865/7a218dd4-2575-41e8-b615-01f97c0a9bdb

## Installing the plugin
Now available in the plugin store!
1. Navigate to the plugins store (Settings => Community plugins -> Browse)
2. Search for 'Markdown table checkboxes'
3. Select the plugin and click Install

## How to use
- Simply enable the plugin and type a markdown checkbox inside a table. It will get converted to a HTML checkbox.
- In either live preview or view mode, (un)check the checkbox and the state will be reflected in your file.

## How it works
- Whenever a closing bracket `]` is typed to close a checkbox, it will be replaced by an HTML checkbox `<input type="checkbox" unchecked id="...">`.
- When the checkbox is clicked in the preview, the checkbox in the file is found by its ID.
- The `checked` state of the checkbox gets toggled.

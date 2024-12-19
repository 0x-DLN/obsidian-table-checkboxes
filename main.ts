import { Editor, EditorPosition, Plugin, TFile, WorkspaceWindow } from 'obsidian';
import { TableCheckboxesPluginSettingsTab } from 'settings';


interface TableCheckboxesPluginSettings {
  convertCheckboxesOutsideTables: boolean;
}

const DEFAULT_SETTINGS: TableCheckboxesPluginSettings = {
  convertCheckboxesOutsideTables: false,
}

export default class TableCheckboxesPlugin extends Plugin {

  settings: TableCheckboxesPluginSettings;

	async onload() {
		this.app.workspace.on("window-open", this.setupWindowHandlers);
		this.setupWindowHandlers(undefined as never, activeWindow);
    await this.loadSettings();
    this.addCommand({
      id: "convert-checkboxes",
      name: "Convert all checkboxes in the current file to HTML checkboxes",
      callback: () => {
        this.convertAllCheckboxes();
      }
    });
    this.addSettingTab(new TableCheckboxesPluginSettingsTab(this.app, this));
	}

	async onunload() {
		this.app.workspace.off("window-open", this.setupWindowHandlers);
	}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

	private setupWindowHandlers = (_workspaceWindow: WorkspaceWindow, win: Window) => {
		this.registerDomEvent(win, "input", (evt: InputEvent): void => {
			if (evt.data !== "]") {
        return;
      }
      const view = this.app.workspace.activeEditor;
      if (!view || !view.editor) {
        return;
      }

      const location = view.editor.getCursor("anchor");
      const rowValue = view.editor.getLine(location.line);
      if (!this.isMDCheckboxInTable(rowValue) || this.closingBracketIsTooFar(rowValue, location.ch)) {
        return;
      }
      const checkbox = this.getCheckboxLength(rowValue, location.ch);
      if (!checkbox) {
        return;
      }
      this.handleCheckboxReplacement(view.editor, location, checkbox);
		});

		this.registerDomEvent(win, "change", async (evt: InputEvent): Promise<void> => {
			// Check for data-task attribute to ignore markdown checkboxes
			const changeEl = evt.target as Element;
			if (changeEl.instanceOf(HTMLInputElement) && changeEl.id && changeEl.hasAttribute("data-task") === false) {
				const view = this.app.workspace.activeEditor;
				if (!view || !view.editor || !view.file) {
					return;
				}
				if (changeEl.getAttribute("type") === "checkbox") {
					const page = await this.app.vault.read(view.file);
					const id = changeEl.id;
					this.toggleCheckbox(page, view.file, changeEl.checked, id);
				}
			}
		});
	}

	private handleCheckboxReplacement (editor: Editor, location: EditorPosition, checkbox: string) {
    const completeCheckbox = checkbox.endsWith("]");
    location.ch = completeCheckbox ? location.ch + 1 : location.ch;
    const start = {...location}; // Shallow copy
    start.ch -= checkbox.length;
    editor.setSelection(start, location); // Select checkbox
    const checkboxId = this.generateUniqueCheckboxId(editor.getDoc().getValue());
    editor.replaceSelection(`<input type="checkbox" unchecked id="${checkboxId}">`); // Replace selection with unchecked HTML checkbox
	}

	private generateUniqueCheckboxId(page: string): string {
		let id = crypto.randomUUID().slice(-6);
		while (this.idExistsInFile(id, page)) {
			id = crypto.randomUUID();
		}
		return id;
	}

	private idExistsInFile(id: string, page: string): boolean {
		const idIndex = page.search(id);
		return idIndex !== -1;
	}

	private isMDCheckboxInTable(rowValue: string): boolean {
		// Regex to check if markdown checkbox is inside table
		const tableRegex = /^(\s|>)*\|.*-\s?(?:\[\s?\]|\[).*/m;
		if (rowValue.match(tableRegex)) {
			return true;
		}
		return false;
	}


  private closingBracketIsTooFar(rowValue: string, ch: number): boolean {
    if (rowValue[ch-1] === "[" || rowValue[ch-2] === "[") {
      return false;
    }
    return true;
  }

	// Allow for different amounts of whitespace
	private getCheckboxLength(viewData: string, ch: number): string | null {
    const completeCheckbox = viewData[ch] === "]";
    // Some fuckery with the position of the cursor due to the autocomplete option in Obsidian
    const areaToCheck = viewData.slice(ch-4, completeCheckbox ? ch + 1 : ch);
		const checkboxRegex = /-\s{0,1}\[\s{0,1}\]?/;
		const checkboxMatch = areaToCheck.match(checkboxRegex);
    if (!checkboxMatch) {
      return null;
    }
    return checkboxMatch[0];
	}

	private toggleCheckbox(page: string, file: TFile, isChecked: boolean, checkboxId: string): void {
		page = page.replace(new RegExp(`<input type="checkbox" (un)?checked id="${checkboxId}">`), `<input type="checkbox" ${isChecked ? "" : "un"}checked id="${checkboxId}">`);
		this.app.vault.modify(file, page);
	}

  private convertAllCheckboxes(): void {
    console.log(this.settings.convertCheckboxesOutsideTables);
    const view = this.app.workspace.activeEditor;
    if (!view || !view.editor) {
      return;
    }
    const page = view.editor.getDoc().getValue();
    const checkboxes = this.getCheckboxesToConvert(page, this.settings.convertCheckboxesOutsideTables);
    this.convertCheckboxes(view.editor, checkboxes);
    console.log(checkboxes);
  }

  private getCheckboxesToConvert(page: string, convertOutsideTables: boolean) {
    const checkboxes: { from: EditorPosition, to: EditorPosition }[] = [];
    const lines = page.split('\n');
    let lineCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip if we only want table checkboxes and this line isn't in a table
      if (!convertOutsideTables && !this.isMDCheckboxInTable(line)) {
        lineCount++;
        continue;
      }

      // Find all checkboxes in the line
      const checkboxRegex = /-\s{0,1}\[\s{0,1}\]/g;
      let match;
      
      while ((match = checkboxRegex.exec(line)) !== null) {
        const from = {
          line: lineCount,
          ch: match.index
        };
        const to = {
          line: lineCount,
          ch: match.index + match[0].length
        };
        checkboxes.push({ from, to });
      }

      lineCount++;
    }

    return checkboxes;
  }

  private convertCheckboxes(editor: Editor, checkboxes: { from: EditorPosition, to: EditorPosition }[]) {
    const checkboxIds = Array.from({ length: checkboxes.length }, () => this.generateUniqueCheckboxId(editor.getDoc().getValue()));
    const selections = checkboxes.map((checkbox) => ({
      anchor: checkbox.from,
      head: checkbox.to,
    }));
    editor.setSelections(selections);
    // A bit scuffed, but easiest way to replace selections without having to recalculate the position of the cursor every time
    editor.replaceSelection("!!PLACEHOLDER_TO_BE_REPLACED_WITH_CHECKBOX!!");
    let page = editor.getDoc().getValue();
    checkboxIds.forEach((id) => {
      page = page.replace(/!!PLACEHOLDER_TO_BE_REPLACED_WITH_CHECKBOX!!/, `<input type="checkbox" unchecked id="${id}">`);
    });
    editor.getDoc().setValue(page);
  }
}

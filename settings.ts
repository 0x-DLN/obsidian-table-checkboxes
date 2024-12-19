import TableCheckboxesPlugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export class TableCheckboxesPluginSettingsTab extends PluginSettingTab {
  plugin: TableCheckboxesPlugin;

  constructor(app: App, plugin: TableCheckboxesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Convert checkboxes outside tables')
      .setDesc('Convert checkboxes outside tables to HTML checkboxes')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.convertCheckboxesOutsideTables)
          .onChange(async (value) => {
            this.plugin.settings.convertCheckboxesOutsideTables = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
const Plugin = require("obsidian").Plugin;
const PluginSettingTab = require("obsidian").PluginSettingTab;
const App = require("obsidian").App;
const Setting = require("obsidian").Setting;
const MarkdownView = require("obsidian").MarkdownView;

const LEFT_TO_RIGHT_OVERRIDE = "\u202d";
const POP_DIRECTIONAL_FORMATTING = "\u202c";

const DEFAULT_SETTINGS = {
	enabled: true,
	backgroundColor: "rgba(255, 0, 0, 1)",
	textColor: "black",
};

class HiddenCharactersPlugin extends Plugin {
	async onload() {
		await this.loadSettings();

		this.registerCodeMirror((cm) => {
			cm.setOption(
				"specialChars",
				/[\u202d\u202c]|&lrm;|&rlm;|&#x202D;|&#x202C;/
			);
			cm.setOption(
				"specialCharPlaceholder",
				this.specialCharPlaceholder.bind(this)
			);
		});

		this.statusBar = this.addStatusBarItem();
		this.registerInterval(
			window.setInterval(() => this.updateStatusBar(), 1000)
		);

		this.addSettingTab(new HiddenCharactersSettingTab(this.app, this));
	}

	refresh() {
		if (this.settings.enabled) {
			this.registerCodeMirror((cm) => {
				cm.setOption(
					"specialChars",
					/[\u202d\u202c]|&lrm;|&rlm;|&#x202D;|&#x202C;/
				);
				cm.setOption(
					"specialCharPlaceholder",
					this.specialCharPlaceholder.bind(this)
				);
			});
		} else {
			this.app.workspace.iterateCodeMirrors((cm) => {
				cm.setOption("specialChars", null);
				cm.setOption("specialCharPlaceholder", null);
			});
		}
	}

	specialCharPlaceholder(ch) {
		const decoded = this.decodeHtmlEntity(ch);
		const span = document.createElement("span");
		span.textContent = decoded;
		span.title = this.getCharacterName(ch);
		span.classList.add("hidden-unicode-character");
		span.style.backgroundColor = this.settings.backgroundColor;
		span.style.color = this.settings.textColor;
		return span;
	}

	decodeHtmlEntity(str) {
		if (str === "&lrm;" || str === "&#x202D;") {
			return LEFT_TO_RIGHT_OVERRIDE;
		} else if (str === "&rlm;" || str === "&#x202C;") {
			return POP_DIRECTIONAL_FORMATTING;
		} else {
			return str;
		}
	}

	getCharacterName(ch) {
		switch (ch) {
			case LEFT_TO_RIGHT_OVERRIDE:
				return "Left-to-right override (U+202D)";
			case POP_DIRECTIONAL_FORMATTING:
				return "Pop directional formatting (U+202C)";
			default:
				return `Unicode character: ${ch}`;
		}
	}

	updateStatusBar() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			this.statusBar.setText("");
			return;
		}

		const content = view.data;
		const hiddenUnicodeCount = (content.match(/[\u202d\u202c]/g) || []).length;
		this.statusBar.setText(`${hiddenUnicodeCount} hidden characters`);
	}

	onunload() {
		this.app.workspace.iterateCodeMirrors((cm) => {
			cm.setOption("specialChars", null);
			cm.setOption("specialCharPlaceholder", null);
		});
		this.statusBar.remove();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class HiddenCharactersSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h2", { text: "Show Hidden Unicode Settings" });

		new Setting(containerEl)
			.setName("Enable")
			.setDesc("Toggle showing hidden Unicode characters")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabled)
					.onChange(async (value) => {
						this.plugin.settings.enabled = value;
						await this.plugin.saveSettings();
						this.plugin.refresh();
					})
			);

		new Setting(containerEl)
			.setName("Background Color")
			.setDesc("Set the background color for hidden Unicode characters")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.backgroundColor)
					.onChange(async (value) => {
						this.plugin.settings.backgroundColor = value;
						await this.plugin.saveSettings();
						this.plugin.refresh();
					})
			);

		new Setting(containerEl)
			.setName("Text Color")
			.setDesc("Set the text color for hidden Unicode characters")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.textColor)
					.onChange(async (value) => {
						this.plugin.settings.textColor = value;
						await this.plugin.saveSettings();
						this.plugin.refresh();
					})
			);
	}
}

module.exports = HiddenCharactersPlugin;

// TODO: Functions to write
// - One to remove hidden characters in a file

// This renames files that have hidden characters in the name
// let count = 0;
// await app.fileManager.runAsyncLinkUpdate(async () => {
// 	for (let file of app.vault.getMarkdownFiles()) {
// 		let newName = file.name.replace(/[\u202d\u202c]/g, "");
// 		if (newName !== file.name) {
// 			count++;
// 			await app.vault.rename(
// 				file,
// 				file.path.substring(0, file.path.length - file.name.length) + newName
// 			);
// 		}
// 	}
// });
// console.log("Renamed " + count + " files.");

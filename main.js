// TODO: Functions to write
// - One to show hidden characters
// - One to remove hidden characters in a file

// This renames files that have hidden characters in the name
let count = 0;
await app.fileManager.runAsyncLinkUpdate(async () => {
    for (let file of app.vault.getMarkdownFiles()) {
        let newName = file.name.replace(/[\u202d\u202c]/g, '');
        if (newName !== file.name) {
            count++;
            await app.vault.rename(file, file.path.substring(0, file.path.length - file.name.length) + newName);
        }
    }
});
console.log('Renamed ' + count + ' files.');

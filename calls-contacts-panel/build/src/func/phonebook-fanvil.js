"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhonebookFanvilXml = exports.buildPhonebookFanvil = void 0;
const phonebook_1 = require("./phonebook");
const xmlTemplate = (body) => `
<?xml version="1.0" encoding="utf-8"?>
<FanvilIPPhoneDirectory clearlight="true">
  ${body}
</FanvilIPPhoneDirectory>
`;
function buildPhonebookFanvil(phonebook) {
    var _a;
    let body = '';
    for (const entry of phonebook) {
        let displayName = entry.combinedName;
        displayName = displayName.replace(/&/g, '+');
        if (!displayName || !((_a = entry.numbers) === null || _a === void 0 ? void 0 : _a.length))
            continue;
        body += '  <DirectoryEntry>\n';
        body += `    <Name>${displayName}</Name>\n`;
        const mobile = entry.numbers.find(nr => nr.type === 'cell');
        if (mobile) {
            body += `    <Mobile>${mobile.number}</Mobile>\n`;
            const remaining = entry.numbers.filter(nr => nr !== mobile);
            if (remaining[0])
                body += `    <Telephone>${remaining[0].number}</Telephone>\n`;
            if (remaining[1])
                body += `    <Other>${remaining[1].number}</Other>\n`;
        }
        else {
            if (entry.numbers[0])
                body += `    <Telephone>${entry.numbers[0].number}</Telephone>\n`;
            if (entry.numbers[1])
                body += `    <Mobile>${entry.numbers[1].number}</Mobile>\n`;
            if (entry.numbers[2])
                body += `    <Other>${entry.numbers[2].number}</Other>\n`;
        }
        body += '  </DirectoryEntry>\n';
    }
    return xmlTemplate(body.trim()).trim();
}
exports.buildPhonebookFanvil = buildPhonebookFanvil;
function getPhonebookFanvilXml() {
    return buildPhonebookFanvil((0, phonebook_1.getPhonebook)());
}
exports.getPhonebookFanvilXml = getPhonebookFanvilXml;
//# sourceMappingURL=phonebook-fanvil.js.map
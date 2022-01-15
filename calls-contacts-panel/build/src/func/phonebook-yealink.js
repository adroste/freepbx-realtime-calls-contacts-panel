"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhonebookYealinkXml = exports.buildPhonebookYealink = void 0;
const phonebook_1 = require("./phonebook");
const typeToLabel = {
    'cell': 'Mobile',
    'work': 'Work',
    'home': 'Home',
    'other': 'Other',
    'internal': 'Extension',
};
const xmlTemplate = (body) => `
<?xml version="1.0" encoding="utf-8"?>
<CompanyIPPhoneDirectory clearlight="true">
  <Title>Phonelist</Title>
  <Prompt>Prompt</Prompt>
  ${body}
</CompanyIPPhoneDirectory>
`;
function buildPhonebookYealink(phonebook) {
    var _a;
    let body = '';
    for (const entry of phonebook) {
        let displayName = entry.combinedName;
        displayName = displayName.replace(/&/g, '+');
        if (!displayName || !((_a = entry.numbers) === null || _a === void 0 ? void 0 : _a.length))
            continue;
        body += '  <DirectoryEntry>\n';
        body += `   <Name>${displayName}</Name>\n`;
        for (const nr of entry.numbers) {
            body += `   <Telephone label="${typeToLabel[nr.type]}">${nr.number}</Telephone>\n`;
        }
        body += '  </DirectoryEntry>\n';
    }
    return xmlTemplate(body.trim()).trim();
}
exports.buildPhonebookYealink = buildPhonebookYealink;
function getPhonebookYealinkXml() {
    return buildPhonebookYealink((0, phonebook_1.getPhonebook)());
}
exports.getPhonebookYealinkXml = getPhonebookYealinkXml;
//# sourceMappingURL=phonebook-yealink.js.map
import { PhonebookEntry, getPhonebook } from './phonebook';

// const TAG = '[Phonebook Yealink]';

const typeToLabel = {
  'cell': 'Mobile',
  'work': 'Work',
  'home': 'Home',
  'other': 'Other',
  'internal': 'Extension',
} as const;

const xmlTemplate = (body: string) => `
<?xml version="1.0" encoding="utf-8"?>
<CompanyIPPhoneDirectory clearlight="true">
  <Title>Phonelist</Title>
  <Prompt>Prompt</Prompt>
  ${body}
</CompanyIPPhoneDirectory>
`;

export function buildPhonebookYealink(phonebook: PhonebookEntry[]) {
  let body = '';
  for (const entry of phonebook) {
    let displayName = entry.combinedName;
    // & signs are not supported by some yealink phones => replace them with +
    displayName = displayName.replace(/&/g, '+');

    if (!displayName || !entry.numbers?.length)
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

export function getPhonebookYealinkXml() {
  return buildPhonebookYealink(getPhonebook());
}
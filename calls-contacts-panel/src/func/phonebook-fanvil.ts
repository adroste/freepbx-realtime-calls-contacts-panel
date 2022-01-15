import { PhonebookEntry, getPhonebook } from './phonebook';

// const TAG = '[Phonebook Fanvil]';

// spec see https://www.fanvil.com/Uploads/Temp/download/20191226/5e0454ec2e7f0.pdf pages 8/9
const xmlTemplate = (body: string) => `
<?xml version="1.0" encoding="utf-8"?>
<FanvilIPPhoneDirectory clearlight="true">
  ${body}
</FanvilIPPhoneDirectory>
`;

export function buildPhonebookFanvil(phonebook: PhonebookEntry[]) {
  let body = '';
  for (const entry of phonebook) {
    let displayName = entry.combinedName;
    // & signs are not supported by fanvil phones => replace them with +
    displayName = displayName.replace(/&/g, '+');

    if (!displayName || !entry.numbers?.length)
      continue;

    body += '  <DirectoryEntry>\n';
    body += `    <Name>${displayName}</Name>\n`;

    const mobile = entry.numbers.find(nr => nr.type === 'cell');
    // fanvil only supports 3 numbers per entry;
    if (mobile) {
      body += `    <Mobile>${mobile.number}</Mobile>\n`;
      const remaining = entry.numbers.filter(nr => nr !== mobile);
      if (remaining[0])
        body += `    <Telephone>${remaining[0].number}</Telephone>\n`;
      if (remaining[1])
        body += `    <Other>${remaining[1].number}</Other>\n`;
    } else {
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

export function getPhonebookFanvilXml() {
  return buildPhonebookFanvil(getPhonebook());
}
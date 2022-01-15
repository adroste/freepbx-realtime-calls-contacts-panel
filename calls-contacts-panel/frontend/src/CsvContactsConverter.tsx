import { parse, unparse } from 'papaparse';
import { useCallback, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { CsvUpload } from './CsvUpload';
import { useTranslation } from 'react-i18next';

const DEFAULT_GROUP_NAME = 'Alle';
const DEFAULT_GROUP_TYPE = 'external';

// arrays are in order of fill priority
// if a field is already full it will try the next field
const hTypeMap = {
  'Display Name': ['displayname'],
  'First Name': ['fname'],
  'Last Name': ['lname'],
  'Title': ['title'],
  'Company': ['company'],
  'Address': ['address'],
  'Number (Cell)': ['phone', { number: '$value', type: 'cell' }],
  'Number (Work)': ['phone', { number: '$value', type: 'work' }],
  'Number (Home)': ['phone', { number: '$value', type: 'home' }],
  'Number (Other)': ['phone', { number: '$value', type: 'other' }],
  'Fax (Cell)': ['phone', { number: '$value', type: 'cell', flags: 'fax' }],
  'Fax (Work)': ['phone', { number: '$value', type: 'work', flags: 'fax' }],
  'Fax (Home)': ['phone', { number: '$value', type: 'home', flags: 'fax' }],
  'Fax (Other)': ['phone', { number: '$value', type: 'other', flags: 'fax' }],
  'Email': ['email'],
  'Website': ['website'],
} as const;

type HType = keyof typeof hTypeMap;

const hTypes = Object.keys(hTypeMap) as HType[];

function generateContactManagerCsvData(csvData: string[][], colTypes: (HType | "")[]): string[][] {
  // slice removes header (col definitions)
  const rows = csvData.slice(1);
  if (colTypes.length !== rows[0].length) {
    alert('ERROR: types and col count dont match');
    throw new Error('ERROR: types and col count dont match');
  }
  type Contact = { [key: string]: { value: string, template: any }[] };
  const contacts: Contact[] = []; 
  let numberMaxCount = 0, emailMaxCount = 0, websiteMaxCount = 0;
  rows.forEach((row) => {
    const contact: Contact = {};
    row.forEach((value, index) => {
      // filter unset values like ""
      if (hTypeMap.hasOwnProperty(colTypes[index]) && value) {
        const [key, template] = hTypeMap[colTypes[index] as HType];
        if (!contact[key])
          contact[key] = [];
        contact[key].push({ value, template });
      }
    });
    const numberCount = contact['phone']?.length || 0;
    const emailCount = contact['email']?.length || 0;
    const websiteCount = contact['website']?.length || 0;
    // filter contacts without a number
    if (numberCount === 0)
      return;

    contacts.push(contact);
    numberMaxCount = Math.max(numberMaxCount, numberCount);
    emailMaxCount = Math.max(emailMaxCount, emailCount);
    websiteMaxCount = Math.max(websiteMaxCount, websiteCount);
  });
  
  const headers = [
    'groupname',
    'grouptype',
    'displayname',
    'fname',
    'lname',
    'title',
    'company',
    'address',
    ...Array.from(Array(numberMaxCount)).flatMap((_,i) => 
      ['number', 'type', 'extension', 'flags', 'speeddial', 'locale'].map(p => `phone_${i+1}_${p}`)),
    ...Array.from(Array(emailMaxCount)).map((_,i) => `email_${i+1}`),
    ...Array.from(Array(websiteMaxCount)).map((_,i) => `website_${i+1}`),
  ];

  const data: string[][] = [headers];
  contacts.forEach(contact => {
    const row = headers.map(header => {
      if (header === 'groupname')
        return DEFAULT_GROUP_NAME;
      if (header === 'grouptype')
        return DEFAULT_GROUP_TYPE;

      const [key, position, subKey] = header.split('_');
      const index = (parseInt(position || '1') - 1) || 0;
      const { value, template } = contact[key]?.[index] || {};
      if (subKey) {
        const templateValue = template?.[subKey];
        if (templateValue !== '$value')
          return templateValue || '';
      }
      return value || '';
    });
    data.push(row);
  });

  return data;
}

export function CsvContactsConverter() {
  const { t } = useTranslation();
  // const { cols, setCols } = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const { control, register, handleSubmit } = useForm();
  const { fields, replace } = useFieldArray({
    control,
    name: "colmap", // unique name for your Field Array
  });

  const onCsv = useCallback((csv: string) => {
    let { data } = parse(csv) as { data: string[][] };
    if (!data)
      return;
    const headerLength = data[0].length;
    data = data.filter(row => row.length === headerLength);
    if (data.length < 2)
      return;
    replace(data[0].map(col => ({ col, type: '' })));
    setCsvData(data);
  }, [replace]);

  const onSubmit = useCallback(data => {
    const colTypes = (data.colmap as Array<{ col: string, type: HType | "" }>).map(v => v.type);
    const cmData = generateContactManagerCsvData(csvData, colTypes);
    const csv = unparse(cmData);

    const csvContent = "data:text/csv;charset=utf-8," + csv;
    const uri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = uri;
    link.download = 'contacts-converted-for-freepbx.csv';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 5000);
  }, [csvData]);

  return (
    <div>
      <CsvUpload onCsv={onCsv} />
      <hr className="my-4" />
      <form onSubmit={handleSubmit(onSubmit)}>
        {fields.map((field, index) => (
          <div key={field.id} className="flex mb-2">
            <input
              type='text'
              key={field.id}
              disabled
              className="block border-none text-sm text-right"
              {...register(`colmap.${index}.col`)}
            />
            <select {...register(`colmap.${index}.type`)}
              className="shadow-sm focus:ring-sky-500 focus:border-sky-500 block sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">{t('Ignore')}</option>
              <option disabled value="-------">-------</option>
              {hTypes.map(type =>
                <option key={type} value={type}>{type}</option>
              )}
            </select>
          </div>
        ))}
        <button
          type="submit"
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
          {t('Generate')} (.csv)
        </button>
      </form>
    </div>
  );
}

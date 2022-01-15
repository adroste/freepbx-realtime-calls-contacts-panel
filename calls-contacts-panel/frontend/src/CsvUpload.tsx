import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export function CsvUpload({ onCsv }: { onCsv: (csv: string) => void }) {
  const { t } = useTranslation();
  const { register, handleSubmit } = useForm();

  const onSubmit = useCallback(data => {
    const file = data['csvFile']?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const csv = event.target?.result;
        if (csv)
          onCsv(csv as string);
      }
      reader.readAsText(file, 'utf-8');
    }
  }, [onCsv]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('csvFile')} type="file" accept=".csv" />
      <button 
        type="submit"
        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
      >
        {t('Upload')} (.csv)
      </button>
    </form>
  );
}

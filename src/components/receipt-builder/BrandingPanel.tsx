'use client';

import React from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { UseFormSetValue, UseFormGetValues } from 'react-hook-form';

interface Props {
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

export default function BrandingPanel({ setValue, getValues }: Props) {
  const values = getValues();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Branding</h3>
      <div className="grid gap-3">
        <FileUpload label="Logo Upload" accept="image/*" fileName={values.companyLogoUrl ? 'Uploaded' : ''} onChange={(file) => {
          if (!file) return setValue('companyLogoUrl', '');
          const reader = new FileReader();
          reader.onload = () => setValue('companyLogoUrl', reader.result as string);
          reader.readAsDataURL(file);
        }} />

        <FileUpload label="Signature Upload" accept="image/*" fileName={values.signatureUrl ? 'Uploaded' : ''} onChange={(file) => {
          if (!file) return setValue('signatureUrl', '');
          const reader = new FileReader();
          reader.onload = () => setValue('signatureUrl', reader.result as string);
          reader.readAsDataURL(file);
        }} />

        <FileUpload label="Stamp Upload" accept="image/*" fileName={values.stampUrl ? 'Uploaded' : ''} onChange={(file) => {
          if (!file) return setValue('stampUrl', '');
          const reader = new FileReader();
          reader.onload = () => setValue('stampUrl', reader.result as string);
          reader.readAsDataURL(file);
        }} />

        <FileUpload label="Watermark Upload" accept="image/*" fileName={values.watermarkUrl ? 'Uploaded' : ''} onChange={(file) => {
          if (!file) return setValue('watermarkUrl', '');
          const reader = new FileReader();
          reader.onload = () => setValue('watermarkUrl', reader.result as string);
          reader.readAsDataURL(file);
        }} />
      </div>
    </div>
  );
}

import AdminTemplateManager from '@/components/templates/admin-template-manager';
import SamplePdfGenerator from '@/components/templates/sample-pdf-generator';

export default function AdminTemplatesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <SamplePdfGenerator />
        <AdminTemplateManager />
      </div>
    </main>
  );
}

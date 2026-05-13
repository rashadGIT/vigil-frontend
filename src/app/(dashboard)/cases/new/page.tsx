import { PageHeader } from '@/components/layout/page-header';
import { CreateCaseForm } from '@/components/cases/create-case-form';

export default function NewCasePage() {
  return (
    <div>
      <PageHeader title="New Case" description="Enter deceased information to create a case." />
      <CreateCaseForm />
    </div>
  );
}

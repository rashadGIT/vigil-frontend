import { IntakeForm } from '@/components/intake/intake-form';

interface IntakePageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function IntakePage({ params }: IntakePageProps) {
  const { tenantSlug } = await params;
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first container — D-07 */}
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Begin Service Arrangements</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Please fill out the form below. Our team will follow up shortly.
          </p>
        </div>

        <IntakeForm tenantSlug={tenantSlug} />
      </div>
    </div>
  );
}

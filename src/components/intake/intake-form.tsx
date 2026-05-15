'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { publicApiClient } from '@/lib/api/public-client';
import { cn } from '@/lib/utils/cn';

const step1Schema = z.object({
  deceasedFirstName: z.string().min(1, 'First name is required'),
  deceasedLastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  serviceType: z.enum(['burial', 'cremation', 'graveside', 'memorial'], {
    errorMap: () => ({ message: 'Select a service type' }),
  }),
  veteranStatus: z.boolean().default(false),
  placeOfDeath: z.string().max(200).optional(),
});

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email address'),
  relationship: z.string().min(1, 'Relationship is required'),
  addressLine1: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  isFinanciallyResponsible: z.boolean().default(true),
});

const step2Schema = z.object({
  primary: contactSchema,
  hasSecondary: z.boolean().default(false),
  secondary: contactSchema.partial().optional(),
});

const step3Schema = z.object({
  notes: z.string().optional(),
});

const step4Schema = z.object({
  financialResponsibilityAcknowledgment: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge financial responsibility to continue' }),
  }),
  howDidYouHearAboutUs: z.string().max(100).optional(),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;
type Step4Values = z.infer<typeof step4Schema>;

const TOTAL_STEPS = 4;

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Deceased', 'Contact', 'Preferences', 'Confirm'];
  return (
    <div className="flex items-center gap-1 mb-8">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-colors',
              s < current ? 'bg-primary border-primary text-primary-foreground'
                : s === current ? 'border-primary text-primary'
                : 'border-muted text-muted-foreground',
            )}>
              {s < current ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            <span className={cn('text-xs hidden sm:block', s === current ? 'text-primary font-medium' : 'text-muted-foreground')}>
              {labels[s - 1]}
            </span>
          </div>
          {s < total && <div className={cn('h-0.5 flex-1 mx-1 mb-4', s < current ? 'bg-primary' : 'bg-muted')} />}
        </div>
      ))}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive mt-1">{message}</p>;
}

interface IntakeFormProps {
  tenantSlug: string;
}

export function IntakeForm({ tenantSlug }: IntakeFormProps) {
  const [step, setStep] = useState(1);
  const [familyAccessToken, setFamilyAccessToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Values | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Values | null>(null);

  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data ?? { serviceType: 'burial', veteranStatus: false },
  });

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: step2Data ?? { primary: { isFinanciallyResponsible: true }, hasSecondary: false },
  });

  const step3Form = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: step3Data ?? {},
  });

  const step4Form = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
  });

  const hasSecondary = step2Form.watch('hasSecondary');

  async function handleStep3Submit(values: Step3Values) {
    setStep3Data(values);
    setStep(4);
  }

  async function handleStep4Submit(values: Step4Values) {
    if (!step1Data || !step2Data || !step3Data) return;

    setIsSubmitting(true);
    try {
      const primary = step2Data.primary;
      const secondary = step2Data.hasSecondary ? step2Data.secondary : undefined;

      const { data: response } = await publicApiClient.post<{ caseId: string; familyAccessToken: string }>(
        `/intake/${tenantSlug}`,
        {
          deceasedName: `${step1Data.deceasedFirstName} ${step1Data.deceasedLastName}`.trim(),
          deceasedDob: step1Data.dateOfBirth || undefined,
          deceasedDod: step1Data.dateOfDeath || undefined,
          serviceType: step1Data.serviceType,
          veteranStatus: step1Data.veteranStatus,
          placeOfDeath: step1Data.placeOfDeath || undefined,
          primaryContact: {
            name: `${primary.firstName} ${primary.lastName}`.trim(),
            relationship: primary.relationship,
            email: primary.email,
            phone: primary.phone,
            addressLine1: primary.addressLine1 || undefined,
            city: primary.city || undefined,
            state: primary.state || undefined,
            zip: primary.zip || undefined,
            isFinanciallyResponsible: primary.isFinanciallyResponsible,
          },
          ...(secondary && secondary.firstName && {
            secondaryContact: {
              name: `${secondary.firstName} ${secondary.lastName ?? ''}`.trim(),
              relationship: secondary.relationship ?? '',
              email: secondary.email || undefined,
              phone: secondary.phone || undefined,
              addressLine1: secondary.addressLine1 || undefined,
              city: secondary.city || undefined,
              state: secondary.state || undefined,
              zip: secondary.zip || undefined,
              isFinanciallyResponsible: secondary.isFinanciallyResponsible ?? false,
            },
          }),
          notes: step3Data.notes || undefined,
          financialResponsibilityAcknowledgment: values.financialResponsibilityAcknowledgment,
          howDidYouHearAboutUs: values.howDidYouHearAboutUs || undefined,
        },
      );

      setFamilyAccessToken(response.familyAccessToken);
    } catch {
      toast.error('Submission failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (familyAccessToken) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Thank you</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your information has been received. Our team will be in touch shortly.
          </p>
        </div>
        <div className="pt-2">
          <a
            href={`/family/${familyAccessToken}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Track Your Arrangements
          </a>
          <p className="text-xs text-muted-foreground mt-3">
            Bookmark this link to check on your case status at any time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator current={step} total={TOTAL_STEPS} />

      {/* Step 1: Deceased Info */}
      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit((v) => { setStep1Data(v); setStep(2); })} className="space-y-5">
          <h2 className="text-lg font-semibold">About the Deceased</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="deceased-first-name" className="font-medium">First Name <span className="text-destructive">*</span></Label>
              <Input id="deceased-first-name" {...step1Form.register('deceasedFirstName')} className="w-full text-base h-12" />
              <FieldError message={step1Form.formState.errors.deceasedFirstName?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="deceased-last-name" className="font-medium">Last Name <span className="text-destructive">*</span></Label>
              <Input id="deceased-last-name" {...step1Form.register('deceasedLastName')} className="w-full text-base h-12" />
              <FieldError message={step1Form.formState.errors.deceasedLastName?.message} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-medium">Date of Birth</Label>
              <Input type="date" {...step1Form.register('dateOfBirth')} className="w-full h-12" />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">Date of Death</Label>
              <Input type="date" {...step1Form.register('dateOfDeath')} className="w-full h-12" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Service Type <span className="text-destructive">*</span></Label>
            <Select
              value={step1Form.watch('serviceType')}
              onValueChange={(v) => step1Form.setValue('serviceType', v as Step1Values['serviceType'], { shouldValidate: true })}
            >
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select a service type" />
              </SelectTrigger>
              <SelectContent>
                {(['burial', 'cremation', 'graveside', 'memorial'] as const).map((v) => (
                  <SelectItem key={v} value={v} className="text-base py-3 capitalize">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={step1Form.formState.errors.serviceType?.message} />
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Place of Death</Label>
            <Input {...step1Form.register('placeOfDeath')} className="w-full text-base h-12" placeholder="e.g. Hospital, Home, Nursing Facility" />
          </div>

          <div className="flex items-center gap-3 py-1">
            <Checkbox
              id="veteranStatus"
              checked={step1Form.watch('veteranStatus')}
              onCheckedChange={(v) => step1Form.setValue('veteranStatus', !!v)}
            />
            <Label htmlFor="veteranStatus" className="font-normal cursor-pointer">
              The deceased was a U.S. military veteran
            </Label>
          </div>

          <Button type="submit" className="w-full h-12 text-base mt-2">Continue</Button>
        </form>
      )}

      {/* Step 2: Family Contact */}
      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit((v) => { setStep2Data(v); setStep(3); })} className="space-y-5">
          <h2 className="text-lg font-semibold">Primary Contact</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-medium">First Name <span className="text-destructive">*</span></Label>
              <Input {...step2Form.register('primary.firstName')} className="w-full text-base h-12" />
              <FieldError message={step2Form.formState.errors.primary?.firstName?.message} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">Last Name <span className="text-destructive">*</span></Label>
              <Input {...step2Form.register('primary.lastName')} className="w-full text-base h-12" />
              <FieldError message={step2Form.formState.errors.primary?.lastName?.message} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Relationship <span className="text-destructive">*</span></Label>
            <Input {...step2Form.register('primary.relationship')} className="w-full text-base h-12" placeholder="e.g. Spouse, Child, Sibling" />
            <FieldError message={step2Form.formState.errors.primary?.relationship?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-medium">Phone <span className="text-destructive">*</span></Label>
              <Input type="tel" {...step2Form.register('primary.phone')} className="w-full text-base h-12" placeholder="(555) 000-0000" />
              <FieldError message={step2Form.formState.errors.primary?.phone?.message} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">Email <span className="text-destructive">*</span></Label>
              <Input type="email" {...step2Form.register('primary.email')} className="w-full text-base h-12" placeholder="you@email.com" />
              <FieldError message={step2Form.formState.errors.primary?.email?.message} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Street Address</Label>
            <Input {...step2Form.register('primary.addressLine1')} className="w-full text-base h-12" placeholder="123 Main St" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="font-medium">City</Label>
              <Input {...step2Form.register('primary.city')} className="w-full text-base h-12" />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">State</Label>
              <Input {...step2Form.register('primary.state')} className="w-full text-base h-12" placeholder="OH" maxLength={2} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">ZIP</Label>
              <Input {...step2Form.register('primary.zip')} className="w-full text-base h-12" />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <Checkbox
              id="financiallyResponsible"
              checked={step2Form.watch('primary.isFinanciallyResponsible')}
              onCheckedChange={(v) => step2Form.setValue('primary.isFinanciallyResponsible', !!v)}
            />
            <Label htmlFor="financiallyResponsible" className="font-normal cursor-pointer">
              I am financially responsible for services
            </Label>
          </div>

          {/* Secondary contact toggle */}
          <div className="border-t pt-5">
            {!hasSecondary ? (
              <button
                type="button"
                onClick={() => step2Form.setValue('hasSecondary', true)}
                className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
              >
                <Plus className="h-4 w-4" /> Add another family contact
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Second Contact</h3>
                  <button
                    type="button"
                    onClick={() => step2Form.setValue('hasSecondary', false)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-medium">First Name</Label>
                    <Input {...step2Form.register('secondary.firstName')} className="w-full text-base h-12" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-medium">Last Name</Label>
                    <Input {...step2Form.register('secondary.lastName')} className="w-full text-base h-12" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="font-medium">Relationship</Label>
                  <Input {...step2Form.register('secondary.relationship')} className="w-full text-base h-12" placeholder="e.g. Spouse, Child" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-medium">Phone</Label>
                    <Input type="tel" {...step2Form.register('secondary.phone')} className="w-full text-base h-12" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-medium">Email</Label>
                    <Input type="email" {...step2Form.register('secondary.email')} className="w-full text-base h-12" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit" className="flex-1 h-12 text-base">Continue</Button>
          </div>
        </form>
      )}

      {/* Step 3: Service Preferences */}
      {step === 3 && (
        <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-5">
          <h2 className="text-lg font-semibold">Service Preferences</h2>

          <div className="space-y-1">
            <Label className="font-medium">Additional Notes</Label>
            <Textarea
              {...step3Form.register('notes')}
              rows={5}
              className="w-full text-base resize-none"
              placeholder="Any special requests, preferences, or information our team should know..."
            />
          </div>

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>Back</Button>
            <Button type="submit" className="flex-1 h-12 text-base">Continue</Button>
          </div>
        </form>
      )}

      {/* Step 4: Financial Acknowledgment */}
      {step === 4 && (
        <form onSubmit={step4Form.handleSubmit(handleStep4Submit)} className="space-y-6">
          <h2 className="text-lg font-semibold">Confirmation</h2>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2 border">
            <p className="font-medium text-foreground">Financial Responsibility Statement</p>
            <p>
              By checking the box below, you acknowledge that you are authorizing {' '}
              our funeral home to begin making arrangements and that you accept financial
              responsibility for the services requested.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="financialAck"
              checked={step4Form.watch('financialResponsibilityAcknowledgment') === true}
              onCheckedChange={(v) => step4Form.setValue('financialResponsibilityAcknowledgment', v === true ? true : (false as never))}
              className="mt-0.5"
            />
            <Label htmlFor="financialAck" className="font-normal cursor-pointer leading-relaxed">
              I acknowledge financial responsibility for funeral services and authorize the funeral home to proceed with arrangements.
              <span className="text-destructive"> *</span>
            </Label>
          </div>
          <FieldError message={step4Form.formState.errors.financialResponsibilityAcknowledgment?.message} />

          <div className="space-y-1">
            <Label className="font-medium">How did you hear about us?</Label>
            <Select onValueChange={(v) => step4Form.setValue('howDidYouHearAboutUs', v)}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select one (optional)" />
              </SelectTrigger>
              <SelectContent>
                {['Google Search', 'Family Referral', 'Friend Referral', 'Social Media', 'Previously Used', 'Other'].map((v) => (
                  <SelectItem key={v} value={v} className="text-base py-3">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(3)}>Back</Button>
            <Button type="submit" className="flex-1 h-12 text-base" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Information'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

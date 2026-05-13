export interface ITenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  planTier: string;
  active: boolean;
  googleReviewUrl: string | null;
  flagESignatures: boolean;
  flagGplCompliance: boolean;
  flagVendorCoordination: boolean;
  flagCalendar: boolean;
  flagFamilyPortal: boolean;
  createdAt: string;
  updatedAt: string;
}

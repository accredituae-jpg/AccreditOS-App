import {
  BillableCertificateItem,
  GeneratedLineItem,
  ManualLineItem,
  TaxMode,
} from "../utils/invoice-calculations";
import { InvoiceItemGrouping } from "../utils/billing.utils";
import type { Certificate } from "@/features/certificates/types/certificates.types";

export type BillingType = "company" | "individual";
export type WizardStep = 1 | 2 | 3;
export type { InvoiceItemGrouping };

export interface CustomerFormState {
  client: string;
  trnNo: string;
  poBox: string;
  location: string;
  phone: string;
  mobile: string;
  referenceContact: string;
}

export interface PricingGroup {
  key: string;
  course: string;
  awardingBody: string;
  count: number;
}

export interface InvoiceWizardFormContext {
  step: WizardStep;
  setStep: (step: WizardStep) => void;
  billingType: BillingType;
  setBillingType: (type: BillingType) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  handleSelectCompany: (clientId: string) => void;
  selectedTypeId: string;
  setSelectedTypeId: (id: string) => void;
  invoiceTypes: any[];
  customerForm: CustomerFormState;
  setCustomerForm: React.Dispatch<React.SetStateAction<CustomerFormState>>;
  handleCustomerFieldChange: (field: keyof CustomerFormState, value: string) => void;
  allCertificates: Certificate[];
  isLoadingCertificates: boolean;
  selectedCertIds: string[];
  setSelectedCertIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleSelectCertificate: (id: string) => void;
  selectAllFiltered: () => void;
  deselectAllFiltered: () => void;
  certSearchQuery: string;
  setCertSearchQuery: (q: string) => void;
  billableItems: BillableCertificateItem[];
  filteredBillableItems: BillableCertificateItem[];
  selectedItems: BillableCertificateItem[];
  pricingGroups: PricingGroup[];
  courseRates: Record<string, string>;
  setCourseRate: (key: string, rate: string) => void;
  taxMode: TaxMode;
  setTaxMode: (mode: TaxMode) => void;
  saveRatesToClient: boolean;
  setSaveRatesToClient: (val: boolean) => void;
  manualLineItems: ManualLineItem[];
  setManualLineItems: React.Dispatch<React.SetStateAction<ManualLineItem[]>>;
  invoiceDate: Date;
  setInvoiceDate: (date: Date) => void;
  dueDate: Date | undefined;
  setDueDate: (date: Date | undefined) => void;
  notes: string;
  setNotes: (notes: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  nextInvoiceNum: string;
  discountType: "percentage" | "amount";
  setDiscountType: (type: "percentage" | "amount") => void;
  discountValue: string;
  setDiscountValue: (val: string) => void;
  groupingMode: InvoiceItemGrouping;
  setGroupingMode: (mode: InvoiceItemGrouping) => void;
  calculations: {
    lineItems: GeneratedLineItem[];
    subtotal: number;
    discount: number;
    discountRate?: number;
    discountType?: "percentage" | "amount";
    taxableAmount: number;
    vatAmount: number;
    total: number;
  };
  isTrainingType: boolean;
  serviceTypeParam?: "training" | "inspection" | "all";
}

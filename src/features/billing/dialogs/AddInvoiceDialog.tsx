import React, { useState } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, ArrowRight, Check, Hash } from "lucide-react";
import { Client } from "@/lib/clients";
import { getActiveRole } from "@/lib/permissions";
import { UpdateSequenceDialog } from "@/features/certificates/dialogs/UpdateSequenceDialog";
import { useInvoiceWizardForm } from "../hooks/useInvoiceWizardForm";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { WizardStepIndicator } from "../components/invoice-wizard/WizardStepIndicator";
import { Step1Customer } from "../components/invoice-wizard/Step1Customer";
import { Step2ItemsAndPricing } from "../components/invoice-wizard/Step2ItemsAndPricing";
import { Step3Review } from "../components/invoice-wizard/Step3Review";

interface AddInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onAdd: (invoiceData: any) => Promise<void> | void;
}

export function AddInvoiceDialog({
  open,
  onOpenChange,
  clients,
  onAdd,
}: AddInvoiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpdateSeqDialog, setShowUpdateSeqDialog] = useState(false);
  const queryClient = useQueryClient();

  const activeRole = getActiveRole();
  const isDeveloper =
    activeRole === "super_admin" ||
    activeRole === "admin" ||
    activeRole === "operation_admin";

  const wizard = useInvoiceWizardForm({ open, clients });

  const handleClose = () => {
    onOpenChange(false);
    wizard.resetForm();
  };

  const handleFinalSubmit = async () => {
    if (wizard.step !== 3 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = wizard.getSubmissionPayload();
      await onAdd(payload);
      await wizard.syncRatesToClient();
      handleClose();
    } catch (err) {
      console.error("Failed to create invoice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wizard.step === 3 && wizard.canProceedToStep3 && !isSubmitting) {
      handleFinalSubmit();
    }
  };

  const selectedTypeObj = wizard.invoiceTypes.find(
    (t: any) => t.id === wizard.selectedTypeId
  );

  return (
    <>
      <FormDialog
        open={open}
        onCloseAttempt={handleClose}
        title="Create Tax Invoice"
        description={
          wizard.step === 1
            ? "Step 1: Select recipient and invoice type"
            : wizard.step === 2
            ? "Step 2: Select certificates and set pricing rates"
            : "Step 3: Review summary and issue invoice"
        }
        icon={FileText}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        maxWidth="max-w-2xl"
        topContent={
          <WizardStepIndicator
            currentStep={wizard.step}
            onStepClick={(targetStep) => wizard.setStep(targetStep)}
            canNavigateToStep2={wizard.canProceedToStep2}
            canNavigateToStep3={wizard.canProceedToStep3}
          />
        }
        customFooter={
          <div className="p-4 sm:p-5 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/15 flex-shrink-0 w-full">
            <div className="flex items-center gap-2" />

            <div className="flex items-center justify-end gap-2.5">
              {wizard.step === 1 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    className="h-9 px-4 text-xs font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!wizard.canProceedToStep2}
                    onClick={() => wizard.setStep(2)}
                    className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-xs"
                  >
                    <span>Next: Items & Pricing</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : wizard.step === 2 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => wizard.setStep(1)}
                    className="h-9 px-3.5 text-xs font-medium gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Customer</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!wizard.canProceedToStep3}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      wizard.setStep(3);
                    }}
                    className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-xs"
                  >
                    <span>Review Invoice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => wizard.setStep(2)}
                    disabled={isSubmitting}
                    className="h-9 px-3.5 text-xs font-medium gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Items & Rates</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    loading={isSubmitting}
                    loadingText="Creating Invoice..."
                    onClick={handleFinalSubmit}
                    className="h-9 px-5 text-xs font-bold gap-1.5 shadow-sm bg-primary text-primary-foreground"
                  >
                    <Check className="w-4 h-4" />
                    <span>Create Invoice</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        {/* Step 1: Customer */}
        {wizard.step === 1 && (
          <Step1Customer
            billingType={wizard.billingType}
            onBillingTypeChange={wizard.setBillingType}
            selectedClientId={wizard.selectedClientId}
            onClientChange={wizard.handleSelectCompany}
            clients={clients}
            invoiceTypes={wizard.invoiceTypes}
            selectedTypeId={wizard.selectedTypeId}
            onTypeIdChange={wizard.setSelectedTypeId}
            customerForm={wizard.customerForm}
            onFieldChange={wizard.handleCustomerFieldChange}
            nextInvoiceNum={wizard.nextInvoiceNum}
            isDeveloper={isDeveloper}
            onEditSequence={() => setShowUpdateSeqDialog(true)}
          />
        )}

        {/* Step 2: Items & Pricing */}
        {wizard.step === 2 && (
          <Step2ItemsAndPricing
            billingType={wizard.billingType}
            customerForm={wizard.customerForm}
            isTrainingType={wizard.isTrainingType}
            isLoadingCertificates={wizard.isLoadingCertificates}
            billableItems={wizard.billableItems}
            filteredBillableItems={wizard.filteredBillableItems}
            selectedCertIds={wizard.selectedCertIds}
            onToggleSelectCertificate={wizard.toggleSelectCertificate}
            onSelectAllFiltered={wizard.selectAllFiltered}
            onDeselectAllFiltered={wizard.deselectAllFiltered}
            certSearchQuery={wizard.certSearchQuery}
            onSearchChange={wizard.setCertSearchQuery}
            pricingGroups={wizard.pricingGroups}
            courseRates={wizard.courseRates}
            onRateChange={wizard.setCourseRate}
            taxMode={wizard.taxMode}
            onTaxModeChange={wizard.setTaxMode}
            saveRatesToClient={wizard.saveRatesToClient}
            onSaveRatesToClientChange={wizard.setSaveRatesToClient}
            manualLineItems={wizard.manualLineItems}
            onManualLineItemsChange={wizard.setManualLineItems}
            calculations={wizard.calculations}
            discountType={wizard.discountType}
            discountValue={wizard.discountValue}
            onDiscountTypeChange={wizard.setDiscountType}
            onDiscountValueChange={wizard.setDiscountValue}
            groupingMode={wizard.groupingMode}
            onGroupingModeChange={wizard.setGroupingMode}
          />
        )}

        {/* Step 3: Review & Create */}
        {wizard.step === 3 && (
          <Step3Review
            nextInvoiceNum={wizard.nextInvoiceNum}
            billingType={wizard.billingType}
            customerForm={wizard.customerForm}
            typeName={selectedTypeObj?.name || "Training"}
            taxMode={wizard.taxMode}
            lineItems={wizard.calculations.lineItems}
            groupingMode={wizard.groupingMode}
            onGroupingModeChange={wizard.setGroupingMode}
            calculations={wizard.calculations}
            discountType={wizard.discountType}
            discountValue={wizard.discountValue}
            onDiscountTypeChange={wizard.setDiscountType}
            onDiscountValueChange={wizard.setDiscountValue}
            invoiceDate={wizard.invoiceDate}
            onInvoiceDateChange={wizard.setInvoiceDate}
            dueDate={wizard.dueDate}
            onDueDateChange={wizard.setDueDate}
            notes={wizard.notes}
            onNotesChange={wizard.setNotes}
          />
        )}
      </FormDialog>

      <UpdateSequenceDialog
        open={showUpdateSeqDialog}
        onOpenChange={setShowUpdateSeqDialog}
        sequenceType="invoice"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: qk.nextInvoiceNumber });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }}
      />
    </>
  );
}

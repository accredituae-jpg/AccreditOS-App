import React from "react";
import { Check, User, DollarSign, FileCheck } from "lucide-react";
import { WizardStep } from "../../types/invoice-wizard.types";

interface WizardStepIndicatorProps {
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
  canNavigateToStep2?: boolean;
  canNavigateToStep3?: boolean;
}

export function WizardStepIndicator({
  currentStep,
  onStepClick,
  canNavigateToStep2 = false,
  canNavigateToStep3 = false,
}: WizardStepIndicatorProps) {
  const steps = [
    { id: 1 as WizardStep, label: "Customer", icon: User },
    { id: 2 as WizardStep, label: "Items & Pricing", icon: DollarSign },
    { id: 3 as WizardStep, label: "Review & Create", icon: FileCheck },
  ];

  return (
    <div className="border-b border-border/80 bg-muted/20 px-6 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {steps.map((s, index) => {
          const isCurrent = currentStep === s.id;
          const isPassed = currentStep > s.id;
          const isClickable =
            Boolean(onStepClick) &&
            ((s.id === 1) ||
              (s.id === 2 && canNavigateToStep2) ||
              (s.id === 3 && canNavigateToStep3));

          const IconComponent = s.icon;

          return (
            <React.Fragment key={s.id}>
              {index > 0 && (
                <div
                  className={`flex-1 h-[2px] mx-2 sm:mx-3 transition-colors ${
                    currentStep >= s.id ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(s.id)}
                className={`flex items-center gap-2 group transition-all select-none ${
                  isClickable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-105"
                      : isPassed
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isPassed ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <IconComponent className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span
                    className={`text-[11px] font-semibold transition-colors ${
                      isCurrent
                        ? "text-primary"
                        : isPassed
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground leading-none">
                    Step {s.id}
                  </span>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

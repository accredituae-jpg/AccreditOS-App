import React from "react";
import { formatAED, cn } from "@/lib/utils";
import ReceiptHeaderImg from "@/assets/ReceiptHeader.png";
import FooterImg from "@/assets/Footer.png";
import SealImg from "@/assets/Seal.webp";
import SignatureImg from "@/assets/Signature.webp";
import { formatDateDDMMYYYY } from "../utils/billing.utils";
import type { Receipt } from "../types/billing.types";

export interface ReceiptPrintTemplateProps {
  receipt: Receipt;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  showSeal?: boolean;
}

export const ReceiptPrintTemplate = React.forwardRef<
  HTMLDivElement,
  ReceiptPrintTemplateProps
>(
  (
    {
      receipt,
      id = "receipt-voucher-print-area",
      className,
      style,
      showSeal = true,
    },
    ref,
  ) => {
    const formattedDate = formatDateDDMMYYYY(
      receipt.paymentDate || receipt.date,
    );

    const decimalStr = Number(receipt.amount || 0).toFixed(2);
    const parts = decimalStr.split(".");
    const dhsPart = parts[0];
    const filsPart = parts[1];

    const allocationsDescription = (receipt.allocations || [])
      .map(
        (alloc) =>
          `${alloc.invoiceNumber} (${Number(alloc.amount).toFixed(2)})`,
      )
      .join(" + ");

    return (
      <div
        ref={ref}
        id={id}
        className={cn(
          "bg-white shadow-md w-[800px] min-w-[800px] max-w-[800px] p-8 border-2 border-[#004ba0] rounded-none relative text-left text-slate-800 flex flex-col justify-between shrink-0 overflow-hidden",
          className,
        )}
        style={{
          minHeight: "1131px",
          height: "1131px",
          fontSize: "11px",
          fontFamily: "Outfit, system-ui, sans-serif",
          ...style,
        }}
      >
        <div className="flex-1 flex flex-col">
          <div className="mb-4 -mx-[32px] -mt-[32px] overflow-hidden">
            <img
              src={ReceiptHeaderImg}
              alt="Accredit Management Header"
              className="w-full h-auto object-contain"
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "stretch",
              marginBottom: "18px",
              paddingBottom: "14px",
              borderBottom: "1px solid #e5e7eb",
              gap: "16px",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {receipt.status === "voided" && (
                <div
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1.5px solid #fca5a5",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "900",
                    letterSpacing: "2px",
                  }}
                >
                  VOIDED
                </div>
              )}
              <div
                style={{
                  border: "1px solid #dbe4ef",
                  borderRadius: "8px",
                  overflow: "hidden",
                  display: "inline-flex",
                  alignItems: "stretch",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div
                  style={{
                    background: "#1e3a6e",
                    padding: "6px 12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#93c5fd",
                      fontWeight: "700",
                    }}
                  >
                    Dhs
                  </span>
                </div>
                <div
                  style={{
                    padding: "6px 18px",
                    textAlign: "center",
                    fontWeight: "900",
                    fontFamily: "monospace",
                    fontSize: "22px",
                    color: "#111827",
                    borderRight: "1px solid #d1d5db",
                    minWidth: "70px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    background: "#ffffff",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#6b7280",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "2px",
                    }}
                  >
                    درهم
                  </span>
                  <span>{dhsPart}</span>
                </div>
                <div
                  style={{
                    padding: "6px 14px",
                    textAlign: "center",
                    fontWeight: "800",
                    fontFamily: "monospace",
                    fontSize: "16px",
                    color: "#4b5563",
                    minWidth: "45px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    background: "#f9fafb",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#6b7280",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "2px",
                    }}
                  >
                    فلس
                  </span>
                  <span>{filsPart}</span>
                </div>
                <div
                  style={{
                    background: "#1e3a6e",
                    padding: "6px 12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#93c5fd",
                      fontWeight: "700",
                    }}
                  >
                    Fils
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: "1",
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "900",
                  letterSpacing: "0.5px",
                  color: "#1e3a6e",
                  margin: 0,
                  textTransform: "uppercase",
                  lineHeight: "1.1",
                }}
              >
                RECEIPT VOUCHER
              </h2>
              <h3
                style={{
                  fontSize: "19px",
                  fontWeight: "700",
                  color: "#364f83",
                  margin: "2px 0 0 0",
                  direction: "rtl",
                  lineHeight: "1.1",
                }}
              >
                سند قبض
              </h3>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                alignItems: "flex-end",
                minWidth: "180px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#475569",
                    fontWeight: "600",
                  }}
                >
                  No. / الرقم:
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    color: "#1e3a6e",
                    fontFamily: "monospace",
                  }}
                >
                  {receipt.receiptNumber ? `RV-${receipt.receiptNumber}` : "DRAFT"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#475569",
                    fontWeight: "600",
                  }}
                >
                  Date / التاريخ:
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#0f172a",
                  }}
                >
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#fbfcfe",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                minHeight: "44px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: "1",
                  marginRight: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "#64748b",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Received From / استلمنا من
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#0f172a",
                    marginTop: "2px",
                  }}
                >
                  {receipt.clientSnapshot?.companyName ||
                    receipt.client ||
                    "Individual Client"}
                </span>
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#364f83",
                  direction: "rtl",
                  flexShrink: 0,
                  marginTop: "14px",
                }}
              >
                استلمنا من السيد / السادة
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#fbfcfe",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                minHeight: "44px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: "1",
                  marginRight: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "#64748b",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  The Sum of / مبلغ وقدره
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#0f172a",
                    marginTop: "2px",
                    lineHeight: "1.3",
                  }}
                >
                  {receipt.amountWords || formatAED(receipt.amount)}
                </span>
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#364f83",
                  direction: "rtl",
                  flexShrink: 0,
                  marginTop: "14px",
                }}
              >
                مبلغ وقدره
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#fbfcfe",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Payment Mode / طريقة الدفع
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginTop: "2px",
                      textTransform: "uppercase",
                    }}
                  >
                    {receipt.paymentMethod || "Bank Transfer"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#364f83",
                    direction: "rtl",
                    marginTop: "14px",
                  }}
                >
                  نقداً / شيك
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#fbfcfe",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Bank / البنك
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginTop: "2px",
                    }}
                  >
                    {receipt.bankName || "—"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#364f83",
                    direction: "rtl",
                    marginTop: "14px",
                  }}
                >
                  على بنك
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#fbfcfe",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Cheque / Ref No.
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginTop: "2px",
                    }}
                  >
                    {receipt.referenceNumber || "—"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#364f83",
                    direction: "rtl",
                    marginTop: "14px",
                  }}
                >
                  شيك رقم
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#fbfcfe",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                minHeight: "48px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: "1",
                  marginRight: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "#64748b",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Being / وذلك عن
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginTop: "2px",
                    lineHeight: "1.4",
                  }}
                >
                  {receipt.description ||
                    (allocationsDescription
                      ? `Settlement of Invoices: ${allocationsDescription}`
                      : "Training & Consulting Services")}
                </span>
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#364f83",
                  direction: "rtl",
                  flexShrink: 0,
                  marginTop: "14px",
                }}
              >
                وذلك عن
              </span>
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "11px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#1e3a6e",
                      color: "#ffffff",
                      textAlign: "left",
                    }}
                  >
                    <th
                      style={{
                        padding: "7px 10px",
                        borderBottom: "1px solid #cbd5e1",
                        width: "35px",
                        textAlign: "center",
                      }}
                    >
                      #
                    </th>
                    <th
                      style={{
                        padding: "7px 10px",
                        borderBottom: "1px solid #cbd5e1",
                      }}
                    >
                      Invoice Number
                    </th>
                    <th
                      style={{
                        padding: "7px 10px",
                        borderBottom: "1px solid #cbd5e1",
                      }}
                    >
                      Invoice Date
                    </th>
                    <th
                      style={{
                        padding: "7px 10px",
                        borderBottom: "1px solid #cbd5e1",
                        textAlign: "right",
                      }}
                    >
                      Inv. Total
                    </th>
                    <th
                      style={{
                        padding: "7px 10px",
                        borderBottom: "1px solid #cbd5e1",
                        textAlign: "right",
                      }}
                    >
                      Paid This Voucher
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.allocations && receipt.allocations.length > 0 ? (
                    receipt.allocations.map((alloc, idx) => (
                      <tr
                        key={idx}
                        style={{
                          background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <td
                          style={{
                            padding: "6px 10px",
                            textAlign: "center",
                            color: "#64748b",
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            padding: "6px 10px",
                            fontWeight: "700",
                            color: "#0f172a",
                          }}
                        >
                          {alloc.invoiceNumber}
                        </td>
                        <td style={{ padding: "6px 10px", color: "#475569" }}>
                          {alloc.invoiceDate ? formatDateDDMMYYYY(alloc.invoiceDate) : "—"}
                        </td>
                        <td
                          style={{
                            padding: "6px 10px",
                            textAlign: "right",
                            color: "#475569",
                          }}
                        >
                          {alloc.invoiceTotal !== undefined
                            ? formatAED(alloc.invoiceTotal)
                            : "—"}
                        </td>
                        <td
                          style={{
                            padding: "6px 10px",
                            textAlign: "right",
                            fontWeight: "700",
                            color: "#0f172a",
                          }}
                        >
                          {formatAED(alloc.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr style={{ background: "#ffffff" }}>
                      <td
                        style={{
                          padding: "6px 10px",
                          textAlign: "center",
                          color: "#64748b",
                        }}
                      >
                        1
                      </td>
                      <td
                        style={{
                          padding: "6px 10px",
                          fontWeight: "700",
                          color: "#0f172a",
                        }}
                      >
                        Direct Receipt / Account Settlement
                      </td>
                      <td style={{ padding: "6px 10px", color: "#475569" }}>
                        {formattedDate}
                      </td>
                      <td
                        style={{
                          padding: "6px 10px",
                          textAlign: "right",
                          color: "#475569",
                        }}
                      >
                        {formatAED(receipt.amount)}
                      </td>
                      <td
                        style={{
                          padding: "6px 10px",
                          textAlign: "right",
                          fontWeight: "700",
                          color: "#0f172a",
                        }}
                      >
                        {formatAED(receipt.amount)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr
                    style={{
                      background: "#f1f5f9",
                      borderTop: "2px solid #cbd5e1",
                    }}
                  >
                    <td
                      colSpan={4}
                      style={{
                        padding: "7px 10px",
                        fontWeight: "800",
                        textAlign: "right",
                        color: "#0f172a",
                      }}
                    >
                      Total Voucher Amount / إجمالي السند:
                    </td>
                    <td
                      style={{
                        padding: "7px 10px",
                        fontWeight: "900",
                        textAlign: "right",
                        color: "#1e3a6e",
                        fontSize: "12px",
                      }}
                    >
                      {formatAED(receipt.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "12px",
              padding: "0 10px",
            }}
          >
            <div className="flex flex-col items-center">
              <div className="h-16 flex items-center justify-center"></div>
              <div className="border-t border-slate-400 w-48 pt-1 text-center">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#111",
                    }}
                  >
                    Receiver Sign.
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#364f83",
                      direction: "rtl",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                      flexShrink: 0,
                      fontWeight: "700",
                    }}
                  >
                    توقيع المستلم
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-48 h-16 flex items-center justify-center">
                {showSeal && (
                  <>
                    <img
                      src={SealImg}
                      alt="Accredit Official Seal"
                      className="absolute -left-1 w-16 h-16 object-contain pointer-events-none drop-shadow-xs opacity-95"
                    />
                    <img
                      src={SignatureImg}
                      alt="Authorized Signature"
                      className="relative z-10 w-28 h-auto object-contain"
                    />
                  </>
                )}
              </div>
              <div className="border-t border-slate-400 w-48 pt-1 text-center">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#111",
                    }}
                  >
                    Accountant Sign.
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#364f83",
                      direction: "rtl",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                      flexShrink: 0,
                      fontWeight: "700",
                    }}
                  >
                    المحاسب
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="-mx-[32px] -mb-[32px] overflow-hidden">
            <img
              src={FooterImg}
              alt="Accredit Footer"
              className="w-full h-auto object-contain block"
            />
          </div>
        </div>
      </div>
    );
  },
);

ReceiptPrintTemplate.displayName = "ReceiptPrintTemplate";

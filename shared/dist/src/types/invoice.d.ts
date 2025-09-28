export interface Invoice {
    invoiceId: number;
    clientId: number;
    systemId: number;
    serviceOrderId: number;
    invoiceNumber: number;
    value: number;
    issueDate: string | null;
    invoiceBody: string;
    commissionPercentage: number;
    taxPercentage: number;
}
//# sourceMappingURL=invoice.d.ts.map
export interface ServiceOrder {
    serviceOrderId: number;
    orderNumber: number | null;
    systemId: number;
    consultantId: string;
    architectureId: number;
    description: string;
    characteristics: string;
    requirements: string | null;
    startDate: string | null;
    endDate: string | null;
    statusId: number;
    requestingDepartment: string;
    requestDate: string | null;
    requestPhone: string;
    requestPhoneAreaCode: string | null;
    requestPhone2: string | null;
    requestPhone2AreaCode: string | null;
    requestingUser: string;
    implementationDate: string | null;
    warrantyDate: string | null;
    emailId: number | null;
    prospectRelationId: number | null;
}
//# sourceMappingURL=serviceOrder.d.ts.map
export interface Client {
    clientId: number;
    companyName: string | null;
    tradeName: string | null;
    contactName: string | null;
    phone: string | null;
    phoneExtension: string | null;
    cnpj: string | null;
    address: string | null;
    addressNumber: number | null;
    addressComplement: string | null;
    neighborhood: string;
    zipCode: string | null;
    country: string | null;
    industryId: number | null;
    cityId: number;
    statusId: number | null;
    website: string | null;
    email: string | null;
    contactPosition: string | null;
    clientType: string | null;
    reference: string | null;
    statusComplementId: number | null;
    fax: string | null;
    phoneAreaCode2: string | null;
    phone2: string | null;
}
export interface ClientMonthlyTotal {
    clientId: number;
    year: number;
    month: number;
    invoiceValue: number;
    taxesValue: number;
    netValue: number;
}
export interface ConsultantMonthlyTotal {
    userId: string;
    year: number;
    month: number;
    invoiceValue: number;
    taxesValue: number;
    netValue: number;
    comissionValue: number;
    fixedCost: number;
    profit: number;
}
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
export interface PaginationResult<T> {
    limit: number;
    offset: number;
    total: number;
    hasNext: boolean;
    content: T[];
}
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
export interface User {
    id: string;
    name: string;
    authorizationUserId: string | null;
    registrationNumber: number | null;
    birthDate: string | null;
    companyAdmissionDate: string | null;
    companyDismissalDate: string | null;
    inclusionDate: string | null;
    expirationDate: string | null;
    cpf: string | null;
    rg: string | null;
    issuingAgency: string | null;
    issuingState: string | null;
    address: string | null;
    email: string | null;
    personalEmail: string | null;
    phone: string | null;
    lastModified: string;
    photoUrl: string | null;
    instantMessenger: string | null;
    icq: number | null;
    msn: string | null;
    yahooMessenger: string | null;
    addressComplement: string | null;
    neighborhood: string | null;
    postalCode: string | null;
    city: string | null;
    state: string | null;
    issueDate: string | null;
}
//# sourceMappingURL=index.d.ts.map
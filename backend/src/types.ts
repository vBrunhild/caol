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
  invoiceValue: number,
  taxesValue: number,
  netValue: number;
  comissionValue: number;
  fixedCost: number;
  profit: number;
}

export interface Invoice {
  invoiceId: number;              // co_fatura
  clientId: number;               // co_cliente
  systemId: number;               // co_sistema
  serviceOrderId: number;         // co_os
  invoiceNumber: number;          // num_nf
  value: number;                  // valor
  issueDate: string | null;       // data_emissao
  invoiceBody: string;            // corpo_nf
  commissionPercentage: number;   // comissao_cn
  taxPercentage: number;          // total_imp_inc
}

export interface PaginationResult<T> {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
  content: T[];
}

export default interface PaginationParams {
  limit: number;
  offset: number;
}

export interface ServiceOrder {
  serviceOrderId: number;               // co_os
  orderNumber: number | null;           // nu_os
  systemId: number;                     // co_sistema
  consultantId: string;                 // co_usuario
  architectureId: number;               // co_arquitetura
  description: string;                  // ds_os
  characteristics: string;              // ds_caracteristica
  requirements: string | null;          // ds_requisito
  startDate: string | null;             // dt_inicio
  endDate: string | null;               // dt_fim
  statusId: number;                     // co_status
  requestingDepartment: string;         // diretoria_sol
  requestDate: string | null;           // dt_sol
  requestPhone: string;                 // nu_tel_sol
  requestPhoneAreaCode: string | null;  // ddd_tel_sol
  requestPhone2: string | null;         // nu_tel_sol2
  requestPhone2AreaCode: string | null; // ddd_tel_sol2
  requestingUser: string;               // usuario_sol
  implementationDate: string | null;    // dt_imp
  warrantyDate: string | null;          // dt_garantia
  emailId: number | null;               // co_email
  prospectRelationId: number | null;    // co_os_prospect_rel
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

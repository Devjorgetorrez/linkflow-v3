/**
 * lib/tipos-schema.ts — tipos schema.org oferecidos na tela Identidade.
 *
 * O valor gravado em `schemaTipo` (config/site.ts) é o nome do tipo em inglês,
 * exatamente como o schema.org define; o rótulo é só para o cliente escolher.
 */

export interface TipoSchema { value: string; label: string }
export interface GrupoTiposSchema { grupo: string; tipos: TipoSchema[] }

export const MAX_TIPOS_SCHEMA = 5;

export const GRUPOS_TIPOS_SCHEMA: GrupoTiposSchema[] = [
  {
    grupo: "Genérico",
    tipos: [
      { value: "LocalBusiness", label: "Negócio local (genérico)" },
      { value: "ProfessionalService", label: "Serviço profissional" },
      { value: "Store", label: "Loja / varejo" },
      { value: "Restaurant", label: "Restaurante" },
    ],
  },
  {
    grupo: "Saúde",
    tipos: [
      { value: "MedicalClinic", label: "Clínica médica" },
      { value: "MedicalOrganization", label: "Organização de saúde" },
      { value: "MedicalBusiness", label: "Estabelecimento de saúde" },
      { value: "Physician", label: "Médico / especialista" },
      { value: "Dentist", label: "Dentista" },
      // Psicólogo e nutricionista NÃO existem como tipo no schema.org (404): usar
      // "Estabelecimento de saúde" e descrever a área em `especialidade`.
      { value: "Physiotherapy", label: "Fisioterapia" },
      { value: "Pharmacy", label: "Farmácia" },
      { value: "Optician", label: "Óptica" },
      { value: "Hospital", label: "Hospital" },
    ],
  },
  {
    grupo: "Jurídico e financeiro",
    tipos: [
      { value: "LegalService", label: "Serviço jurídico" },
      { value: "Attorney", label: "Advogado" },
      { value: "AccountingService", label: "Contabilidade" },
      { value: "FinancialService", label: "Serviço financeiro" },
      { value: "InsuranceAgency", label: "Corretora de seguros" },
      { value: "RealEstateAgent", label: "Imobiliária / corretor" },
    ],
  },
  {
    grupo: "Casa e construção",
    tipos: [
      { value: "HomeAndConstructionBusiness", label: "Casa e construção (genérico)" },
      { value: "Plumber", label: "Encanador" },
      { value: "Electrician", label: "Eletricista" },
      { value: "HVACBusiness", label: "Ar-condicionado / climatização" },
      { value: "HousePainter", label: "Pintor" },
      { value: "Locksmith", label: "Chaveiro" },
    ],
  },
  {
    grupo: "Beleza e bem-estar",
    tipos: [
      { value: "HealthAndBeautyBusiness", label: "Saúde e beleza (genérico)" },
      { value: "BeautySalon", label: "Salão de beleza" },
      { value: "HairSalon", label: "Cabeleireiro" },
    ],
  },
  {
    grupo: "Automotivo",
    tipos: [
      { value: "AutoRepair", label: "Oficina mecânica" },
      { value: "AutoBodyShop", label: "Funilaria e pintura" },
    ],
  },
];

const POR_VALOR = new Map<string, string>(
  GRUPOS_TIPOS_SCHEMA.flatMap((g) => g.tipos).map((t) => [t.value, t.label]),
);

/** Rótulo em português do tipo; um tipo que não está na lista aparece pelo próprio nome. */
export function rotuloTipoSchema(value: string): string {
  return POR_VALOR.get(value) ?? value;
}

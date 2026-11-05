/**
 * Contracts of PIM > Configuration > Optional Fields and Custom Fields, recorded on the live demo
 * (specs/pim-5-qualifications-config.plan.md, "Observed API calls").
 */

/** `GET|PUT /pim/optional-field`: four global switches, always sent together. */
export interface OptionalFieldSettings {
  /** "Show Nick Name, Smoker and Military Service in Personal Details". */
  pimShowDeprecatedFields: boolean;
  showSIN: boolean;
  showSSN: boolean;
  /** "Show US Tax Exemptions menu". */
  showTaxExemptions: boolean;
}

export const optionalFieldKeys = [
  'pimShowDeprecatedFields',
  'showSIN',
  'showSSN',
  'showTaxExemptions',
] as const satisfies readonly (keyof OptionalFieldSettings)[];

/**
 * API screen key of a custom field. `personal` (Personal Details) is the only key verified on the
 * live app; the other screens use their own keys.
 */
export type CustomFieldScreen = 'personal' | (string & {});

/** 0 = Text or Number, 1 = Drop Down. */
export const CustomFieldType = { text: 0, dropDown: 1 } as const;
export type CustomFieldTypeId = (typeof CustomFieldType)[keyof typeof CustomFieldType];

export interface CustomFieldRequest {
  fieldName: string;
  screen: CustomFieldScreen;
  fieldType: CustomFieldTypeId;
  /** Comma-separated options of a Drop Down; null for Text or Number. */
  extraData?: string | null;
}

export interface CustomField {
  id: number;
  fieldName: string;
  fieldType: CustomFieldTypeId;
  extraData: string | null;
  screen: CustomFieldScreen;
}

/** `GET|PUT /pim/employees/{empNumber}/custom-fields`: values keyed `custom<id>`. */
export type CustomFieldValues = Record<`custom${number}`, string | null>;

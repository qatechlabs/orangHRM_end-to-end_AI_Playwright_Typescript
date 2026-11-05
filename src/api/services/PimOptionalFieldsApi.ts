import { ApiClient, expectStatus, type ApiResult, type Envelope } from '@api/ApiClient';
import type {
  CustomField,
  CustomFieldRequest,
  CustomFieldScreen,
  CustomFieldValues,
  OptionalFieldSettings,
} from '@api/types/pim-optional';

/**
 * PIM > Configuration > Optional Fields (`/pim/optional-field`) and Custom Fields
 * (`/pim/custom-fields`, values per employee in `/pim/employees/{n}/custom-fields`).
 * Both are global settings on the shared demo: callers restore / delete what they change.
 */
export class PimOptionalFieldsApi {
  constructor(private readonly api: ApiClient) {}

  // ---- optional fields ----

  getOptionalFields(): Promise<ApiResult<Envelope<OptionalFieldSettings>>> {
    return this.api.get('/pim/optional-field');
  }

  async optionalFieldsOrFail(): Promise<OptionalFieldSettings> {
    const res = await this.getOptionalFields();
    expectStatus(res, 200);
    return res.body.data;
  }

  /** Raw body so negative tests can send any shape. */
  updateOptionalFields(
    body: OptionalFieldSettings | Record<string, unknown>,
  ): Promise<ApiResult<Envelope<OptionalFieldSettings>>> {
    return this.api.put('/pim/optional-field', body);
  }

  // ---- custom field definitions ----

  listCustomFields(): Promise<ApiResult<Envelope<CustomField[], { total: number }>>> {
    return this.api.get('/pim/custom-fields', { limit: 50, offset: 0 });
  }

  async customFieldsOrFail(): Promise<CustomField[]> {
    const res = await this.listCustomFields();
    expectStatus(res, 200);
    return res.body.data;
  }

  createCustomField(body: CustomFieldRequest): Promise<ApiResult<Envelope<CustomField>>> {
    return this.api.post('/pim/custom-fields', body);
  }

  deleteCustomFields(ids: number[]): Promise<ApiResult<Envelope<number[]>>> {
    return this.api.delete('/pim/custom-fields', { ids });
  }

  // ---- values of one employee ----

  employeeCustomFields(
    empNumber: number,
    screen?: CustomFieldScreen,
  ): Promise<ApiResult<Envelope<CustomFieldValues, { fields: CustomField[] }>>> {
    return this.api.get(`/pim/employees/${empNumber}/custom-fields`, screen ? { screen } : undefined);
  }

  updateEmployeeCustomFields(
    empNumber: number,
    values: CustomFieldValues,
  ): Promise<ApiResult<Envelope<CustomFieldValues>>> {
    return this.api.put(`/pim/employees/${empNumber}/custom-fields`, values);
  }
}

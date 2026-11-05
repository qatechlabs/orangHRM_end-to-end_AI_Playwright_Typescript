import type { Locator } from '@playwright/test';
import { FormField } from '@pages/components/FormField';

/**
 * @deprecated FormField now supports a Locator scope natively. Use `new FormField(scope, label)`.
 * Kept as a thin alias so existing page objects keep working until they are migrated.
 */
export function scopedField(scope: Locator, label: string): FormField {
  return new FormField(scope, label);
}

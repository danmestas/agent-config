# ARIA Quick Reference for Forms

Essential ARIA attributes for accessible form implementation.

## Field-Level Attributes

| Attribute | Usage | Example |
|-----------|-------|---------|
| `aria-required="true"` | Mark required fields for screen readers | `<input aria-required="true">` |
| `aria-invalid="true"` | Indicate field has a validation error | `<input aria-invalid={!!error}>` |
| `aria-describedby="id"` | Link field to help text or error message | `<input aria-describedby="email-help email-error">` |
| `aria-label="text"` | Provide accessible name when no visible label | `<button aria-label="Remove file">×</button>` |
| `aria-labelledby="id"` | Reference a visible element as the label | `<input aria-labelledby="section-heading">` |
| `aria-disabled="true"` | Mark as disabled while keeping focusability | Better than `disabled` for submit buttons |
| `aria-pressed="true"` | Toggle state for show/hide password buttons | `<button aria-pressed={showPassword}>` |
| `aria-expanded="true"` | Indicate expandable section/dropdown state | `<button aria-expanded={isOpen}>` |
| `aria-live="polite"` | Announce dynamic content changes | Error messages, character counters |
| `aria-live="assertive"` | Immediately announce critical changes | Critical error states (use sparingly) |
| `aria-hidden="true"` | Hide decorative elements from screen readers | Icons next to text, decorative asterisks |

## Form Structure Attributes

| Attribute | Usage | Example |
|-----------|-------|---------|
| `role="group"` | Group related controls without `<fieldset>` | `<div role="group" aria-labelledby="group-label">` |
| `role="radiogroup"` | Group radio buttons | `<div role="radiogroup" aria-label="Rating">` |
| `role="alert"` | Announce errors immediately | `<div role="alert">Error: ...</div>` |
| `role="status"` | Announce non-critical updates | `<div role="status">3 of 5 complete</div>` |
| `role="switch"` | Toggle controls (on/off) | `<button role="switch" aria-checked={checked}>` |

## Autocomplete Values for Common Fields

Always include `autocomplete` to enable browser autofill:

| Field | `autocomplete` value |
|-------|---------------------|
| Full name | `name` |
| First name | `given-name` |
| Last name | `family-name` |
| Email | `email` |
| Phone | `tel` |
| Street address | `street-address` |
| City | `address-level2` |
| State/Province | `address-level1` |
| ZIP/Postal code | `postal-code` |
| Country | `country-name` |
| Credit card number | `cc-number` |
| Card expiry | `cc-exp` |
| Card CVV | `cc-csc` |
| Username | `username` |
| Current password | `current-password` |
| New password | `new-password` |
| Organization | `organization` |
| Job title | `organization-title` |

## Input Modes for Mobile Keyboards

| Field type | `inputMode` | `type` |
|-----------|-------------|--------|
| Email | `email` | `email` |
| Phone | `tel` | `tel` |
| Number (integer) | `numeric` | `text` or `number` |
| Decimal number | `decimal` | `text` |
| URL | `url` | `url` |
| Search | `search` | `search` |
| Credit card | `numeric` | `text` (with mask) |
| ZIP code | `numeric` | `text` |

**Note:** Prefer `inputMode="numeric"` with `type="text"` over `type="number"` for fields like credit cards, PINs, and ZIP codes. The `type="number"` input has spinner buttons, allows `e`/`+`/`-`, and behaves inconsistently across browsers.

## Error Message Pattern

```html
<!-- Field with error -->
<div>
  <label for="email">Email address <span aria-hidden="true">*</span></label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid="true"
    aria-describedby="email-help email-error"
    autocomplete="email"
    inputMode="email"
  />
  <p id="email-help">We'll send your confirmation here</p>
  <p id="email-error" role="alert">
    <span aria-hidden="true">⚠</span>
    Email address must include @ and a domain (e.g., you@example.com)
  </p>
</div>
```

Key points:
- `aria-describedby` lists BOTH help text and error IDs (space-separated)
- `aria-invalid="true"` only when field has an error (remove when valid)
- `role="alert"` on error element announces it immediately to screen readers
- Decorative icons use `aria-hidden="true"`
- Error text is specific and actionable

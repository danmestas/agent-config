---
name: vitaly
version: 0.1.0
description: >
  This skill should be used when generating web form components, auditing form
  accessibility, reviewing form UX, or when the user asks to "check form
  accessibility", "audit this form", "apply form best practices", "make this
  form accessible", "review form UX". Also triggers on form generation tasks
  where the output is a React form component. Based on Vitaly Friedman's
  (Smashing Magazine) accessible web form design patterns.
type: skill
targets:
  - claude-code
category:
  primary: tooling
---

# Vitaly — Accessible Web Form Design

Enforces Vitaly Friedman's best practices for accessible, efficient, inclusive web forms. Derived from Smashing Magazine articles, the 76-question Web Forms Checklist, Smart Interface Design Patterns, and 2025 inclusive design workshops.

**Announce at start:** "Applying Vitaly's accessible form design patterns."

## When to Use

- Generating form components (React, HTML, or any framework)
- Auditing existing form code for accessibility and UX
- Reviewing pull requests that touch form markup
- Designing form layouts and interaction patterns

## Core Rules (Never Violate)

### 1. Labels & Field Identification

- Succinct labels (1-2 words, sentence case) placed **above** inputs
- Never use placeholders as the only label — they vanish on focus
- Floating labels must keep a persistent visible label via `<label>` element
- Mark required fields with asterisk + legend, OR mark optional fields with "(optional)" — the latter is preferred for long forms
- Never rely on color alone to convey required/error state
- Group related fields with `<fieldset>` + `<legend>`

### 2. Form Structure & Layout

- **Single-column layout only** — creates a straight, predictable scan path
- Ask only what is truly needed — every extra field reduces completion rate
- Order fields from the user's mental model (name → email → details), not the database schema
- Display 5-7 fields at a time; use progressive disclosure for complex forms
- Never put text-input forms inside modals on mobile

### 3. Inputs & Interaction

- Full keyboard accessibility: every element Tab-reachable, operable with Enter/Space
- Visible `:focus-visible` styles on all interactive elements — never remove focus outlines
- Autofocus the first field with a clear visual cue
- Match `inputmode`/`type` to the right mobile keyboard (`email`, `tel`, `numeric`)
- Use `autocomplete` attributes on every applicable field
- Large touch targets for checkboxes/radios (minimum 44x44px)
- Predictable tab order — no surprises
- Password fields: include accessible show/hide toggle with `aria-pressed`

### 4. Validation & Error Handling

- **Inline validation after field completion** (onBlur), not on every keystroke
- Hybrid strategy: "reward early" (show green check on valid), "punish late" (show error only after blur on invalid)
- Link errors to fields via `aria-describedby` pointing to the error element
- Use `aria-live="polite"` regions for dynamic error announcements
- Show total error count above submit button AND in page `<title>`
- **Never disable the submit button without explanation** — use `aria-disabled` + explanatory text so focus and tooltips still work
- Error messages must be specific and actionable: "Email address must include @" not "Invalid input"
- Design to prevent errors: smart defaults, input masks, autocomplete

### 5. Custom Controls

- Style checkboxes/radios with SVGs but keep native elements in the accessibility tree (inclusive hiding)
- Follow WAI-ARIA Authoring Practices for toggles, autocompletes, selects
- Prefer semantic `<button type="submit">` over styled divs
- CAPTCHA: use progressive or invisible alternatives when possible

### 6. Mobile & Responsive

- Match virtual keyboard to field type via `inputmode`
- No forms inside modals/popups on mobile
- Persist user input on page refresh (localStorage or form state management)
- Ensure touch targets are large enough (44x44px minimum)

### 7. Inclusive Design (2025)

- Support `prefers-reduced-motion` for animations
- High contrast mode support
- Never rely on color alone — pair with icons or text
- Test with real assistive technology (screen readers, keyboard-only navigation)

## Audit Workflow

When auditing form code, follow this checklist:

1. **Scan structure**: Single column? Logical field order? Minimal fields?
2. **Check labels**: Every input has a visible `<label>` with `htmlFor`/`for`? No placeholder-only labels?
3. **Check keyboard**: All elements Tab-reachable? Visible focus styles? Logical tab order?
4. **Check validation**: Inline errors on blur? `aria-describedby` linking? `aria-live` for dynamic errors? Error count above submit?
5. **Check submit**: Button not disabled without explanation? Clear action label ("Submit Feedback" not "Submit")?
6. **Check mobile**: Correct `inputmode`/`type`? Large touch targets? No form-in-modal?
7. **Check accessibility**: `aria-invalid` on errored fields? `aria-required` or `required` attribute? `autocomplete` attributes?

Output a compliance table:

```
| Category              | Status | Issues |
|-----------------------|--------|--------|
| Labels                | ✓/✗    | ...    |
| Structure             | ✓/✗    | ...    |
| Keyboard              | ✓/✗    | ...    |
| Validation            | ✓/✗    | ...    |
| Submit                | ✓/✗    | ...    |
| Mobile                | ✓/✗    | ...    |
| Accessibility (ARIA)  | ✓/✗    | ...    |
```

## Generation Mode

When generating form components, apply all core rules automatically. The output component must:

1. Use semantic HTML elements (`<form>`, `<label>`, `<fieldset>`, `<legend>`)
2. Include `htmlFor` on every `<Label>` matching the input `id`
3. Include `aria-describedby` pointing to help text and error elements
4. Include `aria-invalid={true}` when a field has an error
5. Include `aria-live="polite"` on error message containers
6. Use `onBlur` validation (not onChange for every keystroke)
7. Show a character counter with `aria-live="polite"` for textareas with limits
8. Replace the form with a confirmation screen on successful submission
9. Show a loading spinner + disabled button during submission
10. Include `autocomplete` attributes on name, email, phone, address fields
11. Use `inputMode` for mobile keyboard optimization
12. Mark optional fields with "(optional)" in the label text
13. Mark required fields with a red asterisk + screen-reader text

## Form Type Patterns

Consult `references/form-patterns.md` for type-specific best practices:
- Feedback surveys, NPS, CSAT
- Contact forms
- Registration / signup
- Multi-step wizards
- Medical intake
- Job applications
- Payment forms
- File upload forms

## Additional Resources

### Reference Files

- **`references/form-patterns.md`** — Detailed best practices per form type (survey, registration, wizard, payment, etc.)
- **`references/aria-reference.md`** — Quick reference for ARIA attributes used in forms

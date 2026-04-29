---
name: shadcn-forms
version: 0.1.0
description: >
  This skill should be used when generating React form components with shadcn/ui,
  wiring up react-hook-form with zod validation, choosing the right shadcn/ui input
  component for each field type, or when the user asks to "build a form with shadcn",
  "add form validation", "use react-hook-form", "create a zod schema for this form".
  Provides component selection guidance, validation patterns, and production-ready
  implementation recipes for shadcn/ui v4 forms.
type: skill
targets:
  - claude-code
category:
  primary: tooling
---

# shadcn/ui Form Building Guide

Production-ready patterns for building forms with shadcn/ui components, React Hook Form, and Zod validation. Covers component selection, validation wiring, accessibility, performance, and dark mode support.

**Announce at start:** "Applying shadcn/ui form building patterns."

## Core Stack

- **shadcn/ui** — accessible, composable UI components
- **React Hook Form** — performant form state management (uncontrolled by default)
- **Zod** — type-safe schema validation
- **@hookform/resolvers** — bridges Zod schemas to React Hook Form

## Form Structure Pattern

Every form follows this architecture:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

// 1. Define Zod schema
const schema = z.object({ ... });

// 2. Create form with resolver
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
  mode: "onBlur", // validate on blur per Vitaly's rules
});

// 3. Render with Controller + Field components
<form onSubmit={form.handleSubmit(onSubmit)}>
  <Controller
    name="fieldName"
    control={form.control}
    render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={field.name}>Label</FieldLabel>
        <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
        <FieldDescription>Help text</FieldDescription>
        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
    )}
  />
</form>
```

## Component Selection Rules

Always use the most appropriate shadcn/ui component for each field type. Never use a plain `<input>` when a specialized component exists.

| Field Type | shadcn/ui Component | When to Use |
|-----------|-------------------|-------------|
| Short text | `Input` | Names, emails, URLs, single-line text |
| Long text | `Textarea` | Comments, descriptions, messages |
| Single select (few options) | `RadioGroup` + `RadioGroupItem` | 2-5 mutually exclusive options |
| Single select (many options) | `Select` + `SelectContent/Item` | 6+ options in a dropdown |
| Single select (searchable) | `Combobox` | Large lists (countries, languages, etc.) |
| Multiple select | `Checkbox` (multiple) | Pick several from a list |
| Boolean toggle | `Switch` | On/off settings, preferences |
| Boolean agreement | `Checkbox` (single) | Terms acceptance, consent |
| Date | `Calendar` in `Popover` | Date selection (use date-fns for formatting) |
| Date range | `Calendar` mode="range" | Start/end date pairs |
| Number range | `Slider` | Budgets, ratings on a continuous scale |
| Rating (1-5) | Custom star buttons or `RadioGroup` | Satisfaction, quality ratings |
| Rating (0-10 NPS) | Custom button grid | Net Promoter Score |
| Password | `Input` type="password" + show/hide `Button` | Login, registration |
| OTP/Code | `InputOTP` + `InputOTPGroup/Slot` | Verification codes |
| File upload | Custom dropzone + `Button` | Document/image uploads |

**Rule:** If shadcn/ui has a component for it, use it. Do not reimplement dropdowns, date pickers, or toggles from scratch.

## Validation Patterns

### Zod Schema Best Practices

```tsx
const schema = z.object({
  // Strings with helpful messages
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),

  // Optional with transform
  phone: z.string().optional().transform(v => v?.replace(/\D/g, "")),

  // Enum for selects/radios
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Please select a priority level",
  }),

  // Boolean with refinement
  terms: z.boolean().refine(v => v === true, "You must accept the terms"),

  // Number with range
  rating: z.number().min(1).max(5),

  // Conditional validation
  // (use .refine or .superRefine at the object level)
});
```

### Validation Mode

Set `mode: "onBlur"` to validate when fields lose focus (not on every keystroke):

```tsx
const form = useForm({
  resolver: zodResolver(schema),
  mode: "onBlur",
  reValidateMode: "onChange", // re-validate on change AFTER first blur error
});
```

### Conditional Validation

```tsx
const schema = z.object({
  accountType: z.enum(["personal", "business"]),
  companyName: z.string().optional(),
}).refine(
  data => data.accountType !== "business" || !!data.companyName,
  { message: "Company name required for business accounts", path: ["companyName"] }
);
```

## Submission Pattern

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);
const [isSubmitted, setIsSubmitted] = useState(false);

async function onSubmit(data: z.infer<typeof schema>) {
  setIsSubmitting(true);
  try {
    await submitToServer(data);
    setIsSubmitted(true);
  } catch (err) {
    form.setError("root", { message: "Submission failed. Please try again." });
  } finally {
    setIsSubmitting(false);
  }
}

// Submit button with loading state
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
  ) : "Submit Feedback"}
</Button>

// Root-level error display
{form.formState.errors.root && (
  <p role="alert" className="text-sm text-destructive">
    {form.formState.errors.root.message}
  </p>
)}
```

## Focus Management

On validation failure, focus the first errored field:

```tsx
async function onSubmit(data) {
  try {
    await submit(data);
  } catch {
    const firstError = Object.keys(form.formState.errors)[0];
    if (firstError) form.setFocus(firstError);
  }
}
```

## Dynamic Fields

Use `useFieldArray` for repeatable sections (work experience, contacts, etc.):

```tsx
import { useFieldArray } from "react-hook-form";

const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "contacts",
});

{fields.map((field, index) => (
  <div key={field.id}>
    <Controller name={`contacts.${index}.email`} ... />
    <Button variant="ghost" size="sm" onClick={() => remove(index)}>Remove</Button>
  </div>
))}
<Button variant="outline" onClick={() => append({ email: "" })}>Add Contact</Button>
```

## Performance Rules

- Set `mode: "onBlur"` (not `"onChange"`) to minimize re-renders
- Use `Controller` (uncontrolled) rather than controlled state for each field
- Memoize expensive option lists with `useMemo`
- Lazy-load heavy components (Calendar, Combobox) with `React.lazy` + `Suspense`

## Dark Mode

Apply theme colors via inline `style` props, not hardcoded hex in classNames:

```tsx
const palette = isDark ? darkPalette : lightPalette;
<Card style={{ backgroundColor: palette.surface, borderColor: palette.border }}>
```

Detect system preference:
```tsx
const [isDark, setIsDark] = useState(false);
useEffect(() => {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  setIsDark(mq.matches);
  const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}, []);
```

## Additional Resources

### Reference Files

- **`references/component-recipes.md`** — Copy-paste recipes for every shadcn/ui form input type (Input, Textarea, Select, RadioGroup, Checkbox, Switch, Calendar, Combobox, Slider, InputOTP)
- **`references/zod-patterns.md`** — Advanced Zod validation patterns (conditional, async, cross-field, transforms, discriminated unions)

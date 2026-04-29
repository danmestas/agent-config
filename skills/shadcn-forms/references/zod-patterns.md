# Advanced Zod Validation Patterns for Forms

## Conditional Validation

Validate fields based on other field values:

```tsx
const schema = z.object({
  accountType: z.enum(["personal", "business"]),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
}).refine(
  data => data.accountType !== "business" || (!!data.companyName && !!data.taxId),
  { message: "Company name and tax ID required for business accounts", path: ["companyName"] }
);
```

## Discriminated Unions

Type-safe conditional schemas:

```tsx
const schema = z.discriminatedUnion("contactMethod", [
  z.object({
    contactMethod: z.literal("email"),
    email: z.string().email("Invalid email"),
  }),
  z.object({
    contactMethod: z.literal("phone"),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
  }),
]);
```

## Cross-Field Validation

Compare two fields:

```tsx
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

## Transform and Preprocess

Clean input before validation:

```tsx
const schema = z.object({
  // Strip whitespace and lowercase
  email: z.string().trim().toLowerCase().email(),

  // Remove non-digits from phone
  phone: z.string().transform(v => v.replace(/\D/g, "")).pipe(
    z.string().min(10, "Phone must be at least 10 digits")
  ),

  // Parse string to number
  age: z.string().transform(Number).pipe(z.number().min(18, "Must be 18+")),

  // Default value
  role: z.string().default("viewer"),
});
```

## Async Validation

Check server-side (e.g., username availability):

```tsx
const schema = z.object({
  username: z.string().min(3).refine(
    async (val) => {
      const res = await fetch(`/api/check-username?u=${val}`);
      return (await res.json()).available;
    },
    { message: "Username is already taken" }
  ),
});
```

**Note:** Async validation requires `mode: "onBlur"` to avoid excessive API calls.

## Array Validation

For dynamic field groups:

```tsx
const schema = z.object({
  contacts: z.array(
    z.object({
      name: z.string().min(1, "Name required"),
      email: z.string().email("Invalid email"),
      role: z.enum(["primary", "secondary"]).default("secondary"),
    })
  ).min(1, "Add at least one contact").max(5, "Maximum 5 contacts"),
});
```

## File Validation

For file upload fields:

```tsx
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

const schema = z.object({
  file: z.instanceof(File)
    .refine(f => f.size <= MAX_FILE_SIZE, "File must be under 5MB")
    .refine(f => ACCEPTED_TYPES.includes(f.type), "Only PDF, PNG, and JPEG allowed"),
});
```

## Helpful Error Messages Cheat Sheet

| Rule | Bad Message | Good Message |
|------|-----------|-------------|
| Required | "Required" | "Full name is required" |
| Min length | "Too short" | "Name must be at least 2 characters" |
| Email | "Invalid" | "Please enter a valid email (e.g., you@example.com)" |
| Number range | "Out of range" | "Rating must be between 1 and 5" |
| Pattern | "Invalid format" | "Phone must be in format (555) 123-4567" |
| Date | "Invalid date" | "Please select a date in the future" |
| File size | "Too large" | "File must be under 5MB (yours is 8.2MB)" |

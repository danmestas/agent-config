# shadcn/ui Form Component Recipes

Copy-paste recipes for every form input type. Each recipe shows the Controller + Field pattern with full accessibility wiring.

## Text Input

```tsx
<Controller
  name="name"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
      <Input
        {...field}
        id={field.name}
        placeholder="Jane Doe"
        autoComplete="name"
        aria-invalid={fieldState.invalid}
        aria-describedby={`${field.name}-desc ${field.name}-error`}
      />
      <FieldDescription id={`${field.name}-desc`}>
        Enter your full legal name.
      </FieldDescription>
      {fieldState.invalid && (
        <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />
      )}
    </Field>
  )}
/>
```

## Email Input

```tsx
<Controller
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
      <Input
        {...field}
        id={field.name}
        type="email"
        inputMode="email"
        placeholder="you@example.com"
        autoComplete="email"
        aria-invalid={fieldState.invalid}
      />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Zod: `z.string().email("Please enter a valid email address")`

## Textarea with Character Counter

```tsx
<Controller
  name="comments"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Comments (optional)</FieldLabel>
      <Textarea
        {...field}
        id={field.name}
        placeholder="Share your thoughts..."
        maxLength={2000}
        className="min-h-[120px] resize-y"
        aria-invalid={fieldState.invalid}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <FieldDescription>Maximum 2000 characters</FieldDescription>
        <span aria-live="polite">{field.value?.length || 0}/2000</span>
      </div>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Zod: `z.string().max(2000, "Must be under 2000 characters").optional()`

## Select Dropdown

```tsx
const priorities = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

<Controller
  name="priority"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Priority</FieldLabel>
      <Select
        items={priorities}
        value={field.value}
        onValueChange={field.onChange}
      >
        <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {priorities.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Zod: `z.enum(["low", "medium", "high", "critical"], { required_error: "Please select a priority" })`

## Radio Group

Best for 2-5 mutually exclusive options with visible labels.

```tsx
const experiences = [
  { label: "Excellent", value: "excellent" },
  { label: "Good", value: "good" },
  { label: "Average", value: "average" },
  { label: "Poor", value: "poor" },
];

<Controller
  name="experience"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>How was your experience?</FieldLabel>
      <RadioGroup
        value={field.value}
        onValueChange={field.onChange}
        className="flex flex-col gap-3"
      >
        {experiences.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem value={option.value} id={`exp-${option.value}`} />
            <Label htmlFor={`exp-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Zod: `z.enum(["excellent", "good", "average", "poor"], { required_error: "Please rate your experience" })`

## Checkbox (Single — Agreement/Consent)

```tsx
<Controller
  name="terms"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={field.name}
          checked={field.value}
          onCheckedChange={field.onChange}
          aria-invalid={fieldState.invalid}
        />
        <div>
          <Label htmlFor={field.name} className="cursor-pointer">
            I agree to the Terms of Service
          </Label>
          <FieldDescription>
            By checking this box, you agree to our terms and privacy policy.
          </FieldDescription>
        </div>
      </div>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Zod: `z.boolean().refine(v => v === true, "You must accept the terms")`

## Checkbox Group (Multiple Selection)

```tsx
const notifications = ["email", "push", "sms"];

<Controller
  name="notifications"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Notification Preferences</FieldLabel>
      <div className="flex flex-col gap-3">
        {notifications.map((type) => (
          <div key={type} className="flex items-center gap-2">
            <Checkbox
              id={`notif-${type}`}
              checked={field.value?.includes(type)}
              onCheckedChange={(checked) => {
                const current = field.value || [];
                field.onChange(
                  checked ? [...current, type] : current.filter((v) => v !== type)
                );
              }}
            />
            <Label htmlFor={`notif-${type}`} className="capitalize cursor-pointer">
              {type}
            </Label>
          </div>
        ))}
      </div>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Zod: `z.array(z.string()).min(1, "Select at least one notification method")`

## Switch (Toggle)

```tsx
<Controller
  name="darkMode"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field orientation="horizontal" data-invalid={fieldState.invalid}>
      <div className="flex-1">
        <FieldLabel htmlFor={field.name}>Dark Mode</FieldLabel>
        <FieldDescription>Enable dark theme for this form.</FieldDescription>
      </div>
      <Switch
        id={field.name}
        checked={field.value}
        onCheckedChange={field.onChange}
        aria-invalid={fieldState.invalid}
      />
    </Field>
  )}
/>
```

Zod: `z.boolean().default(false)`

## Date Picker (Calendar in Popover)

```tsx
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

<Controller
  name="date"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Date</FieldLabel>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              data-empty={!field.value}
              className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
              aria-invalid={fieldState.invalid}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {field.value ? format(field.value, "PPP") : "Pick a date"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
        </PopoverContent>
      </Popover>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Zod: `z.date({ required_error: "Please select a date" })`

## Combobox (Searchable Select)

For large option lists (countries, languages, cities, etc.):

```tsx
const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];

<Controller
  name="framework"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Framework</FieldLabel>
      <Combobox
        items={frameworks}
        value={field.value}
        onValueChange={field.onChange}
      >
        <ComboboxInput placeholder="Search frameworks..." />
        <ComboboxContent>
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

## Slider (Numeric Range)

```tsx
<Controller
  name="budget"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <div className="flex items-center justify-between">
        <FieldLabel>Budget</FieldLabel>
        <span className="text-sm text-muted-foreground">${field.value?.[0] || 0}</span>
      </div>
      <Slider
        min={0}
        max={1000}
        step={10}
        value={field.value}
        onValueChange={field.onChange}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>$0</span>
        <span>$1,000</span>
      </div>
    </Field>
  )}
/>
```

Zod: `z.array(z.number()).length(1).default([500])`

## Input OTP (Verification Code)

```tsx
<Controller
  name="otp"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Verification Code</FieldLabel>
      <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <FieldDescription>Enter the 6-digit code sent to your email.</FieldDescription>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Zod: `z.string().length(6, "Code must be exactly 6 digits").regex(/^\d+$/, "Code must contain only numbers")`

## NPS Score (0-10 Button Grid)

Custom implementation using shadcn Button components:

```tsx
<Controller
  name="nps"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>How likely are you to recommend us?</FieldLabel>
      <div className="grid grid-cols-11 gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <Button
            key={i}
            type="button"
            variant={field.value === i ? "default" : "outline"}
            size="sm"
            onClick={() => field.onChange(i)}
            className="w-full"
            aria-label={`Score ${i}`}
            aria-pressed={field.value === i}
          >
            {i}
          </Button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Not at all likely</span>
        <span>Extremely likely</span>
      </div>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Zod: `z.number().min(0).max(10, { message: "Please select a score" })`

## Star Rating (1-5)

Custom implementation with accessible star buttons:

```tsx
<Controller
  name="rating"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Rating</FieldLabel>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => field.onChange(star)}
            className="text-2xl transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
            style={{ color: star <= (field.value || 0) ? "#F59E0B" : "#D1D5DB" }}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            aria-pressed={field.value === star}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {field.value ? `${field.value}/5` : "Select a rating"}
        </span>
      </div>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Zod: `z.number().min(1, "Please select a rating").max(5)`

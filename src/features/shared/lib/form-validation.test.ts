import { describe, expect, it } from 'vitest';
import {
  dateInputSchema,
  formatZodIssues,
  isValidDateInput,
  readFormBoolean,
  readFormString,
  requiredPathOrUrl,
  requiredText,
  slugSchema,
  sortOrderInputSchema,
} from './form-validation';

describe('formatZodIssues', () => {
  it('groups messages by dotted field path and falls back to form', () => {
    expect(
      formatZodIssues([
        { path: ['name'], message: 'Name is required.' },
        { path: ['colors', 0, 'hex'], message: 'Use a hex color.' },
        { path: [], message: 'Something went wrong.' },
        { path: ['name'], message: 'Name is too long.' },
      ]),
    ).toEqual({
      name: ['Name is required.', 'Name is too long.'],
      'colors.0.hex': ['Use a hex color.'],
      form: ['Something went wrong.'],
    });
  });
});

describe('shared schemas', () => {
  it('accepts lowercase slug values and rejects invalid ones', () => {
    expect(slugSchema.safeParse('wedding-ring').success).toBe(true);
    expect(slugSchema.safeParse('Wedding Ring').success).toBe(false);
    expect(slugSchema.safeParse('').success).toBe(false);
  });

  it('builds required text messages from the field label', () => {
    const result = requiredText('Product name').safeParse('   ');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Product name is required.');
  });

  it('parses whole-number sort order input', () => {
    expect(sortOrderInputSchema.parse('3')).toBe(3);
    expect(sortOrderInputSchema.safeParse('1.5').success).toBe(false);
    expect(sortOrderInputSchema.safeParse('-1').success).toBe(false);
  });

  it('validates date input values including impossible dates', () => {
    expect(dateInputSchema.safeParse('2026-10-28').success).toBe(true);
    expect(dateInputSchema.safeParse('2026-02-31').success).toBe(false);
    expect(dateInputSchema.safeParse('28/10/2026').success).toBe(false);
    expect(isValidDateInput('2026-02-28')).toBe(true);
    expect(isValidDateInput('2026-13-01')).toBe(false);
  });

  it('accepts site paths and http(s) URLs only', () => {
    const schema = requiredPathOrUrl('Image URL');
    expect(schema.safeParse('/mock/blog/cover.svg').success).toBe(true);
    expect(schema.safeParse('https://example.com/cover.jpg').success).toBe(true);
    expect(schema.safeParse('javascript:alert(1)').success).toBe(false);
    expect(schema.safeParse('').success).toBe(false);
  });
});

describe('form data readers', () => {
  it('reads strings and booleans from FormData', () => {
    const formData = new FormData();
    formData.set('title', 'Hello');
    formData.set('published', 'on');

    expect(readFormString(formData, 'title')).toBe('Hello');
    expect(readFormString(formData, 'missing')).toBe('');
    expect(readFormBoolean(formData, 'published')).toBe(true);
    expect(readFormBoolean(formData, 'missing')).toBe(false);
  });
});

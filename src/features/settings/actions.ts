'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import {
  formatZodIssues,
  formState,
  readFormString,
  type FormState,
} from '@/features/shared/lib/form-validation';
import { canManageSettings } from '@/features/shared/lib/permissions';
import { settingsFormSchema } from './lib/settings-form-schema';

export type SettingsFormValues = {
  siteName: string;
  phone: string;
  facebookUrl: string;
  instagramUrl: string;
  address: string;
  email: string;
};

export type SettingsFormState = FormState<SettingsFormValues>;

function readSettingsFormValues(formData: FormData): SettingsFormValues {
  return {
    siteName: readFormString(formData, 'siteName'),
    phone: readFormString(formData, 'phone'),
    facebookUrl: readFormString(formData, 'facebookUrl'),
    instagramUrl: readFormString(formData, 'instagramUrl'),
    address: readFormString(formData, 'address'),
    email: readFormString(formData, 'email'),
  };
}

export async function saveSettings(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const values = readSettingsFormValues(formData);
  const session = await getAdminSession();
  if (!session || !canManageSettings(session.role)) {
    return formState(values, {
      form: ['You do not have permission to manage storefront settings.'],
    });
  }

  const parsed = settingsFormSchema.safeParse(values);
  if (!parsed.success) {
    return formState(values, formatZodIssues(parsed.error.issues));
  }

  const existing = await prisma.setting.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (existing) {
    await prisma.setting.update({ where: { id: existing.id }, data: parsed.data });
  } else {
    await prisma.setting.create({ data: parsed.data });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

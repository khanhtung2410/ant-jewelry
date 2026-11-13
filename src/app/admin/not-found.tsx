import { StatusPage, StatusPageLink } from '@/features/shared/components/status-page';

export default function AdminNotFound() {
  return (
    <StatusPage
      eyebrow="ADMIN"
      title="Admin page not found"
      description="The admin page you requested does not exist."
    >
      <StatusPageLink href="/admin">Back to admin</StatusPageLink>
    </StatusPage>
  );
}

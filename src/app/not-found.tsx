import { StatusPage, StatusPageLink } from '@/features/shared/components/status-page';

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="ANT JEWELRY"
      title="Page not found"
      description="The page you are looking for does not exist or may have been moved."
    >
      <StatusPageLink href="/">Back to home</StatusPageLink>
    </StatusPage>
  );
}

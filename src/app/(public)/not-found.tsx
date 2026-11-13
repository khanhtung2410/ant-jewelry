import { StatusPage, StatusPageLink } from '@/features/shared/components/status-page';

export default function PublicNotFound() {
  return (
    <StatusPage
      eyebrow="NOT FOUND"
      title="This page could not be found"
      description="The content you requested is unavailable or does not exist."
    >
      <StatusPageLink href="/">Go to homepage</StatusPageLink>
      <StatusPageLink href="/blog" variant="secondary">
        View blog
      </StatusPageLink>
    </StatusPage>
  );
}

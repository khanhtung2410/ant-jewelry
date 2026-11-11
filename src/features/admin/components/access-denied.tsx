export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h2 className="font-heading text-lg tracking-[0.06em] text-red-800">Access denied</h2>
      <p className="mt-2 text-sm text-red-700">
        {message ?? 'Your account does not have permission to access this area.'}
      </p>
    </div>
  );
}

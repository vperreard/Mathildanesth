import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page',
};

export default function PagePage() {
  return (
    <div className="p-4">
      <h1>Page</h1>
      <p>Page en cours de développement...</p>
    </div>
  );
}

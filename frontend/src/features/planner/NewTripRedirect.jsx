import { Navigate, useSearchParams } from 'react-router-dom';

export default function NewTripRedirect() {
  const [params] = useSearchParams();
  const tripId = params.get('tripId');
  const qs = tripId ? `?tripId=${tripId}` : '';
  return <Navigate to={`/trips/new/basics${qs}`} replace />;
}

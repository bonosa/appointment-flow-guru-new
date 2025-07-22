import React from 'react';

interface BookingStats {
  totalBookings: number;
  totalUsers: number;
  successRate: number;
}

export const useBookingStats = () => {
  const [stats, setStats] = React.useState<BookingStats>({
    totalBookings: 0,
    totalUsers: 0,
    successRate: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchBookingStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://smart-booking-backend-production.up.railway.app/api/booking-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching booking stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      // Fallback to default stats
      setStats({
        totalBookings: 6,
        totalUsers: 1,
        successRate: 100
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBookingStats();
  }, []);

  return { stats, loading, error, refetch: fetchBookingStats };
}; 
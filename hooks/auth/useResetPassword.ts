import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthControllers } from '@/api/authControllers';

import { useSnackbar } from '@/context/SnackbarContext';

export const useResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const resetPassword = async (values: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AuthControllers.resetPassword(values);
      showSnackbar(res?.data?.message || "Password reset successfully!", "success");
      router.push('/'); // Redirect to login page
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return { resetPassword, isLoading, error };
};

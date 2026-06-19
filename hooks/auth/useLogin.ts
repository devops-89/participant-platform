import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthControllers } from '@/api/authControllers';

import { useSnackbar } from '@/context/SnackbarContext';

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const login = async (values: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        ...values,
        role: 'participant',
      };
      
      const res = await AuthControllers.login(payload);
      console.log("Login API Response:", res?.data);
      
      const token = res?.data?.data?.accessToken || res?.data?.accessToken || res?.data?.data?.token || res?.data?.token;
      if (token) {
        localStorage.setItem('accessToken', token);
      }
      
      const userData = res?.data?.data?.user || res?.data?.user || { role: 'participant', ...values };
      localStorage.setItem('user', JSON.stringify(userData));
      
      showSnackbar("Logged in successfully!", "success");
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};

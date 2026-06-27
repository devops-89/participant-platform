import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const useGuestGuard = () => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.replace('/dashboard');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  return { isChecking };
};

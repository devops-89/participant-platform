import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const useGuestGuard = () => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      router.replace('/dashboard');
    } else {
      Promise.resolve().then(() => setIsChecking(false));
    }
  }, [router]);

  return { isChecking };
};

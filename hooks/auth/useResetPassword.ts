import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthControllers } from "@/api/authControllers";
import { useSnackbar } from "@/context/SnackbarContext";
import { RESETPASSWORDPAYLOAD } from "@/types/user";

interface ErrorResponse {
  message: string;
}

export const useResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const resetPassword = async (values: RESETPASSWORDPAYLOAD) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await AuthControllers.resetPassword(values);
      showSnackbar(
        res?.data?.message || "Password reset successfully!",
        "success"
      );
      router.push("/");
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setError(
        error.response?.data?.message ??
          error.message ??
          "Failed to reset password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { resetPassword, isLoading, error };
};
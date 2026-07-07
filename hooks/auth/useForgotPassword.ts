import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthControllers } from "@/api/authControllers";
import { useSnackbar } from "@/context/SnackbarContext";
import { FORGOTPASSWORDPAYLOAD } from "@/types/user";

interface ErrorResponse {
  message: string;
}

export const useForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const forgotPassword = async (values: FORGOTPASSWORDPAYLOAD) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await AuthControllers.forgotPassword(values);

      showSnackbar(
        res?.data?.message || "OTP sent successfully!",
        "success"
      );

      router.push(
        `/verify-otp?email=${encodeURIComponent(
          values.email
        )}&flow=forgot`
      );
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;

      let errorMsg =
        error.response?.data?.message ??
        error.message ??
        "Failed to send OTP.";

      if (
        errorMsg.toLowerCase().includes("couldn't find an account") ||
        errorMsg.toLowerCase().includes("could not find an account")
      ) {
        errorMsg = "Not a registered user. Please register first.";
      }

      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    forgotPassword,
    isLoading,
    error,
  };
};

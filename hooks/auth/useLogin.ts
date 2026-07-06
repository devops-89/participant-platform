import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthControllers } from "@/api/authControllers";
import { useSnackbar } from "@/context/SnackbarContext";
import { LOGINRESPONSE } from "@/types/user";

interface ErrorResponse {
  message: string;
}

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const login = async (values: LOGINRESPONSE) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        ...values,
        role: "participant",
      };

      const res = await AuthControllers.login(payload);

      console.log("Login API Response:", res?.data);

      const token =
        res?.data?.data?.accessToken ||
        res?.data?.accessToken ||
        res?.data?.data?.token ||
        res?.data?.token;

      // Explicitly block non-participants
      const actualUserData =
        res?.data?.data?.user ||
        res?.data?.user ||
        res?.data?.data ||
        res?.data;

      if (
        actualUserData?.role &&
        actualUserData.role !== "participant"
      ) {
        throw new Error(
          "Access denied: Only participants can log into this platform."
        );
      }

      // Block unverified accounts
      if (
        actualUserData?.status === "Pending" ||
        actualUserData?.isVerified === false ||
        actualUserData?.is_verified === false
      ) {
        throw new Error(
          "Please complete OTP verification before logging in."
        );
      }

      if (token) {
        localStorage.setItem("accessToken", token);
      }

      const refreshToken =
        res?.data?.data?.refreshToken || res?.data?.refreshToken;

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      const userData =
        res?.data?.data?.user ||
        res?.data?.user || {
          role: "participant",
          ...values,
        };

      localStorage.setItem("user", JSON.stringify(userData));

      showSnackbar("Logged in successfully!", "success");
      router.push("/dashboard");
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;

      const errorMessage =
        error.response?.data?.message ??
        error.message ??
        "Login failed. Please check your credentials.";

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
    error,
  };
};
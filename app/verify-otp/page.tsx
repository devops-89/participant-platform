import { Suspense } from "react";
import VerifyOtp from "../../components/layouts/VerifyOtp";
import { Suspense } from "react";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtp />
    </Suspense>
  );
}

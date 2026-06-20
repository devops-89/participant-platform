import { Suspense } from "react";
import VerifyOtp from "../../components/layouts/VerifyOtp";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtp />
    </Suspense>
  );
}

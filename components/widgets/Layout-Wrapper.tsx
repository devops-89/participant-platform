"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Header from "./Header";
import Modal from "./Modal";
import Sidebar from "./Sidebar";
import { useSnackbar } from "@/context/SnackbarContext";
import { Box } from "@mui/material";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  
  // Define paths where Sidebar and Header should be hidden
  const hideLayoutPaths = [
    "/",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-otp",
  ];
  const isAuthPage = hideLayoutPaths.includes(pathname);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Synchronously evaluate token during render (after mount) to prevent stale state bugs
  const token = mounted ? (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null) : null;

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthPage && !token) {
      if (localStorage.getItem("intentionalLogout")) {
        localStorage.removeItem("intentionalLogout");
      } else {
        showSnackbar("Session expired. Please log in again.", "error");
      }
      router.replace("/");
    } else if (pathname === "/" && token) {
      router.replace("/dashboard");
    }
  }, [pathname, isAuthPage, router, mounted, token, showSnackbar]);

  // Prevent hydration mismatch and blinks by rendering a placeholder until mounted
  // Also prevent rendering protected content synchronously if not authorized
  if (!mounted || (!isAuthPage && !token)) {
    return <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" }} />;
  }

  if (isAuthPage) {
    return (
      <>
        <Modal />
        <Box
          sx={{
            ml: 0,
            mt: 0,
            px: 0,
            transition: "all 0.3s ease",
          }}
        >
          {children}
        </Box>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <Header />
      <Modal />
      <Box
        sx={{
          ml: "250px",
          mt: "80px",
          px: 5,
          transition: "all 0.3s ease",
        }}
      >
        {children}
      </Box>
    </>
  );
};

export default LayoutWrapper;

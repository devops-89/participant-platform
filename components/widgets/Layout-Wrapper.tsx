"use client";

import { usePathname } from "next/navigation";
import React from "react";
import Header from "./Header";
import LayoutProvider from "./Layout-Provider";
import Modal from "./Modal";
import Sidebar from "./Sidebar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
  const pathname = usePathname();
  
  // Define paths where Sidebar and Header should be hidden
  const hideLayoutPaths = [
    "/",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-otp",
  ];
  const isAuthPage = hideLayoutPaths.includes(pathname);

  if (isAuthPage) {
    return (
      <>
        <Modal />
        <LayoutProvider isFullWidth>{children}</LayoutProvider>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <Header />
      <Modal />
      <LayoutProvider>{children}</LayoutProvider>
    </>
  );
};

export default LayoutWrapper;

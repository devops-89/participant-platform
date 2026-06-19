"use client";
import { roboto } from "@/utils/fonts";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import Link from "next/link";
import React from "react";

interface BREADCRUMBS_PROPS {
  title: string;
  data: {
    title: string;
    href: string;
    onClick?: () => void;
  }[];
}

const Breadcrumb = ({ title, data }: BREADCRUMBS_PROPS) => {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 25,
          mb: 0.5,
          fontFamily: roboto.style.fontFamily,
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      <Breadcrumbs>
        {data.map((item) => (
          <Link
            color="inherit"
            href={item.href}
            style={{ textDecoration: "none" }}
            key={item.title}
            onClick={(e) => {
              if (item.onClick) {
                item.onClick();
              }
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 500,
                textTransform: "capitalize",
                fontFamily: roboto.style.fontFamily,
              }}
            >
              {item.title}
            </Typography>
          </Link>
        ))}
      </Breadcrumbs>
    </Box>
  );
};

export default Breadcrumb;

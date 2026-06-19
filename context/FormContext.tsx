"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type FieldType =
  | "textfield"
  | "autocomplete"
  | "checkbox"
  | "select"
  | "countrySelector"
  | "radio"
  | "switch"
  | "slider"
  | "button"
  | "buttonGroup"
  | "fab"
  | "rating"
  | "transferList"
  | "toggleButton"
  | "numberField"
  | "telInput"
  | "datePicker"
  | "password"
  | "file_upload"
  | "multiselect"
  | "step_break";
export type FieldVariant = "outlined" | "filled" | "standard";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For autocomplete, select, radio
  variant?: FieldVariant;
  helperText?: string;
  config?: Record<string, any>; // Field-specific settings (e.g., defaultCountry, min, max)
}

export interface FormDefinition {
  id: string;
  name: string;
  title: string;
  fields: FormField[];
}

interface FormContextType {
  forms: FormDefinition[];
  addForm: (form: FormDefinition) => void;
  getFormById: (id: string) => FormDefinition | undefined;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [forms, setForms] = useState<FormDefinition[]>([
    {
      id: "default-1",
      name: "Default Registration",
      title: "New Participant Registration",
      fields: [
        {
          id: "f1",
          type: "textfield",
          label: "Full Name",
          required: true,
          variant: "outlined",
        },
        { id: "f2", type: "checkbox", label: "Accept Terms", required: true },
      ],
    },
  ]);

  const addForm = (form: FormDefinition) => {
    setForms((prev) => [...prev, form]);
  };

  const getFormById = (id: string) => {
    return forms.find((f) => f.id === id);
  };

  return (
    <FormContext.Provider value={{ forms, addForm, getFormById }}>
      {children}
    </FormContext.Provider>
  );
};

export const useForms = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error("useForms must be used within a FormProvider");
  }
  return context;
};

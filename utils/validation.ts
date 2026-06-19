import * as Yup from "yup";

export const Login_Validation = Yup.object({
  email: Yup.string()
    .email("Please Enter Valid Email")
    .required("Please Enter Email"),
  password: Yup.string().required("Please Enter Password"),
});

export const AddUser_Validation = Yup.object({
  firstName: Yup.string().required("Please Enter First Name"),
  lastName: Yup.string().required("Please Enter Last Name"),
  email: Yup.string()
    .email("Please Enter Valid Email")
    .required("Please Enter Email"),
  phoneNumber: Yup.string()
    .matches(/^[0-9+\s]+$/, "Invalid Phone Number")
    .required("Please Enter Phone Number"),
  dateOfBirth: Yup.date().required("Please Select Your Date Of Birth"),
  grade: Yup.string().required("Please Select Grade"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must include at least one uppercase letter")
    .matches(/[0-9]/, "Password must include at least one number")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must include at least one special character",
    )
    .required("Please Enter Password"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please Confirm Your Password"),
  schoolName: Yup.string().required("Please Enter Your School Name"),
  country: Yup.string().required("Please Select Country"),
});

export const CONTEST_VALIDATION = Yup.object({
  name: Yup.string().required("Please Enter Contest Name"),
  description: Yup.string().required("Please Enter Contest Description"),
  start_date: Yup.date().required("Please Select Start Date"),
  end_date: Yup.date().required("Please Select End Date"),
  available_regions: Yup.array().min(1, "Please Select At Least One Country"),
  user_level_template_id: Yup.string().required("Please Select Form Template"),
  entry_level_template_id: Yup.string().required(
    "Please Select Entry Form Template",
  ),
});

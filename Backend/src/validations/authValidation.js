const { z } = require("zod");

/**
 * Strong password policy:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "Password must contain at least one special character"
  );

const registerSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: strongPassword,
  mobile: z.string().trim().regex(/^\+?[\d\s-]{10,}$/, "Invalid mobile number format"),
  createdBy: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, "Must agree to terms and conditions"),
  is18Plus: z.boolean().refine((val) => val === true, "Must be 18 years or older"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").refine((dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  }, "You must be at least 18 years old to register"),
  country: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  referredByCode: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: strongPassword,
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: strongPassword,
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  strongPassword,
};

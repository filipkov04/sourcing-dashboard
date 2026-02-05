/**
 * Access Control Utilities
 * Manages email whitelist for registration
 */

/**
 * Get the list of whitelisted emails from environment variables
 * Format: Comma-separated list in ALLOWED_EMAILS env var
 * Example: "user1@gmail.com,user2@gmail.com,user3@gmail.com"
 */
export function getWhitelistedEmails(): string[] {
  const allowedEmails = process.env.ALLOWED_EMAILS || "";

  if (!allowedEmails) {
    // If no whitelist is configured, return empty array (no restrictions)
    return [];
  }

  return allowedEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Check if an email is whitelisted for registration
 * @param email - The email address to check
 * @returns true if email is whitelisted or if no whitelist is configured, false otherwise
 */
export function isEmailWhitelisted(email: string): boolean {
  const whitelist = getWhitelistedEmails();

  // If no whitelist is configured, allow all emails (open registration)
  if (whitelist.length === 0) {
    return true;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return whitelist.includes(normalizedEmail);
}

/**
 * Check if email whitelist is enabled
 * @returns true if whitelist is configured, false otherwise
 */
export function isWhitelistEnabled(): boolean {
  const whitelist = getWhitelistedEmails();
  return whitelist.length > 0;
}

/**
 * Get a user-friendly error message for non-whitelisted emails
 */
export function getWhitelistErrorMessage(): string {
  return "Registration is currently restricted to authorized team members. Please contact your administrator for access.";
}

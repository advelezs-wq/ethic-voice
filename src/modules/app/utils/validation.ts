interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateOrganizationData(data: {
  name: string;
  slug: string;
}): ValidationResult {
  if (!data.name || data.name.trim().length < 2) {
    return {
      isValid: false,
      error: "Organization name must be at least 2 characters long",
    };
  }

  if (!data.slug || data.slug.length < 2) {
    return {
      isValid: false,
      error: "URL slug must be at least 2 characters long",
    };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    return {
      isValid: false,
      error:
        "URL slug can only contain lowercase letters, numbers, and hyphens",
    };
  }

  return { isValid: true };
}

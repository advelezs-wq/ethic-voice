/* eslint-disable @typescript-eslint/no-explicit-any */
export function transformFormDataForSubmission(formData: any) {
  // Create a clean questionnaire object with only string values
  const transformedQuestionnaire: Record<string, string> = {};

  // Arrays to collect checkbox selections
  const whatHappenedSelections: string[] = [];
  const howItHappenedSelections: string[] = [];

  // Get all form values and extract questionnaire fields
  const allFields = formData;

  // Process all fields to find questionnaire data
  Object.entries(allFields).forEach(([key, value]) => {
    // Check if this is a questionnaire field
    if (key.startsWith("questionnaire.")) {
      const fieldName = key.replace("questionnaire.", "");

      if (typeof value === "boolean" && value === true) {
        // Handle checkbox fields
        if (fieldName.startsWith("whatHappened_")) {
          whatHappenedSelections.push(fieldName.replace("whatHappened_", ""));
        } else if (fieldName.startsWith("howItHappened_")) {
          howItHappenedSelections.push(fieldName.replace("howItHappened_", ""));
        }
      } else if (
        typeof value === "string" &&
        value !== "" &&
        value !== "$undefined"
      ) {
        // Handle regular string fields
        transformedQuestionnaire[fieldName] = value;
      }
    }
  });

  // If we have a nested questionnaire object, process it too
  if (formData.questionnaire && typeof formData.questionnaire === "object") {
    Object.entries(formData.questionnaire).forEach(([key, value]) => {
      if (typeof value === "boolean" && value === true) {
        // Handle checkbox fields
        if (key.startsWith("whatHappened_")) {
          const selection = key.replace("whatHappened_", "");
          if (!whatHappenedSelections.includes(selection)) {
            whatHappenedSelections.push(selection);
          }
        } else if (key.startsWith("howItHappened_")) {
          const selection = key.replace("howItHappened_", "");
          if (!howItHappenedSelections.includes(selection)) {
            howItHappenedSelections.push(selection);
          }
        }
      } else if (
        typeof value === "string" &&
        value !== "" &&
        value !== "$undefined"
      ) {
        // Handle regular string fields
        transformedQuestionnaire[key] = value;
      }
    });
  }

  // Add combined checkbox values
  if (whatHappenedSelections.length > 0) {
    transformedQuestionnaire.whatHappened = whatHappenedSelections.join(", ");
  }
  if (howItHappenedSelections.length > 0) {
    transformedQuestionnaire.howItHappened = howItHappenedSelections.join(", ");
  }

  // Return transformed data
  return {
    isAnonymous: formData.isAnonymous || false,
    reporter: formData.reporter || {
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      idDocument: "",
      phone: "",
    },
    reported: formData.reported || {
      firstName: "",
      lastName: "",
      department: "",
      position: "",
    },
    irregularityType: formData.irregularityType || "",
    questionnaire: transformedQuestionnaire,
    uploadedFiles: formData.uploadedFiles || [],
    agreedToTerms: formData.agreedToTerms || false,
  };
}

// Alternative: If React Hook Form is flattening the data
export function reconstructFormData(flatData: any) {
  const reconstructed: any = {
    isAnonymous: false,
    reporter: {},
    reported: {},
    irregularityType: "",
    questionnaire: {},
    uploadedFiles: [],
    agreedToTerms: false,
  };

  Object.entries(flatData).forEach(([key, value]) => {
    if (key.startsWith("reporter.")) {
      const field = key.replace("reporter.", "");
      reconstructed.reporter[field] = value;
    } else if (key.startsWith("reported.")) {
      const field = key.replace("reported.", "");
      reconstructed.reported[field] = value;
    } else if (key.startsWith("questionnaire.")) {
      const field = key.replace("questionnaire.", "");
      reconstructed.questionnaire[field] = value;
    } else {
      reconstructed[key] = value;
    }
  });

  return reconstructed;
}

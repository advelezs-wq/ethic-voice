import React from "react";
import { TextFieldFormElement } from "../fields/TextField";
import { TitleFieldFormElement } from "../fields/TitleField";
import { SubTitleFieldFormElement } from "../fields/SubtitleField";
import { ParagraphFieldFormElement } from "../fields/ParagraphField";
import { SeparatorFieldFormElement } from "../fields/SeparatorField";
import { SpacerFieldFormElement } from "../fields/SpacerField";
import { NumberFieldFormElement } from "../fields/NumberField";
import { TextAreaFieldFormElement } from "../fields/TextAreaField";
import { DateFieldFormElement } from "../fields/DateField";
import { SelectFieldFormElement } from "../fields/SelectField";

export type ElementsType =
  | "TextField"
  | "TitleField"
  | "SubTitleField"
  | "ParagraphField"
  | "SeparatorField"
  | "SpacerField"
  | "NumberField"
  | "TextAreaField"
  | "DateField"
  | "SelectField";

export type SubmitFunction = (key: string, value: string) => void;

export type FormElement = {
  type: ElementsType;

  construct: (id: string) => FormElementInstance;

  designerBtnElement: {
    icon: React.ReactElement;
    label: string;
  };

  designerComponent: React.FC<{
    elementInstance: FormElementInstance;
  }>;
  formComponent: React.FC<{
    elementInstance: FormElementInstance;
    submitValue?: SubmitFunction;
    isInvalid?: boolean;
    defaultValue?: string;
  }>;
  propertiesComponent: React.FC<{
    elementInstance: FormElementInstance;
  }>;

  validate: (FormElement: FormElementInstance, currentValue: string) => boolean;
};

export type FormElementInstance = {
  id: string;
  type: ElementsType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraAttributes?: Record<string, any>;
};

type FormElementsType = {
  [key in ElementsType]: FormElement;
};

export const FormElements: FormElementsType = {
  TextField: TextFieldFormElement,
  TitleField: TitleFieldFormElement,
  SubTitleField: SubTitleFieldFormElement,
  ParagraphField: ParagraphFieldFormElement,
  SeparatorField: SeparatorFieldFormElement,
  SpacerField: SpacerFieldFormElement,
  NumberField: NumberFieldFormElement,
  TextAreaField: TextAreaFieldFormElement,
  DateField: DateFieldFormElement,
  SelectField: SelectFieldFormElement,
};

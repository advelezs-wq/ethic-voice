"use client";

import { Button, ButtonLink } from "@/modules/brand/components/primitives";
import { useDemoCta } from "@/modules/brand/hooks/useDemoCta";

export function PrivacyHeroActions() {
  const demo = useDemoCta();
  return (
    <>
      <Button variant="signal" size="lg" arrow onClick={demo("privacy_expert", "privacy_hero")}>
        Hablar con un experto
      </Button>
      <ButtonLink href="#whistleblowing-security" variant="outline" size="lg">
        Ver los controles
      </ButtonLink>
    </>
  );
}

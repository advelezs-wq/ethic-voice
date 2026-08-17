"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card } from "@heroui/card";

interface TrackingSearchProps {
  onSearch: (code: string) => void;
  initialCode?: string;
  isLoading?: boolean;
}

export function TrackingSearch({
  onSearch,
  initialCode = "",
  isLoading = false,
}: TrackingSearchProps) {
  const [code, setCode] = useState("");

  // Only set initial code once on mount, don't update when initialCode changes
  useEffect(() => {
    if (initialCode && !code) {
      // Strip the REP- prefix if present, keep the opaque token as-is
      const token = initialCode.replace(/^REP-/i, "");
      setCode(token);
    }
  }, []); // Empty dependency array to only run on mount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    onSearch(`REP-${code.trim().toUpperCase()}`);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Alphanumeric token, 12 chars (see FormSubmission.trackingToken)
    const value = e.target.value
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 12)
      .toUpperCase();
    setCode(value);
  };

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="tracking-code"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Código de Referencia
          </label>
          <div className="flex gap-3">
            <Input
              id="tracking-code"
              type="text"
              placeholder="A1B2C3D4E5F6"
              value={code}
              onChange={handleCodeChange}
              className="flex-1"
              size="lg"
              maxLength={12}
              isDisabled={isLoading}
              startContent={
                <span className="text-gray-500 font-mono text-sm">REP-</span>
              }
            />
            <Button
              type="submit"
              isDisabled={!code.trim() || isLoading}
              color="primary"
              size="lg"
              isLoading={isLoading}
            >
              {!isLoading && (
                <i
                  className="icon-[lucide--search] size-4 mr-2"
                  role="img"
                  aria-hidden="true"
                />
              )}
              Buscar
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Formato: REP- seguido de 12 letras/números (ejemplo: REP-A1B2C3D4E5F6)
          </p>
        </div>
      </form>
    </Card>
  );
}

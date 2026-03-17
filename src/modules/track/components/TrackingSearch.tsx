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
      // Extract just the numbers from initialCode if it has REP- prefix
      const numbers = initialCode.replace(/[^0-9]/g, "");
      setCode(numbers);
    }
  }, []); // Empty dependency array to only run on mount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    // Format the final code when submitting
    const finalCode = code.trim().padStart(6, "0");
    onSearch(`REP-${finalCode}`);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 6 digits
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
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
              placeholder="000001"
              value={code}
              onChange={handleCodeChange}
              className="flex-1"
              size="lg"
              maxLength={6}
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
            Formato: REP-NNNNNN (ejemplo: REP-000001)
          </p>
        </div>
      </form>
    </Card>
  );
}

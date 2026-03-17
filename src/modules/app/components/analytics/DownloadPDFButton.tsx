"use client";

import React, { useState } from 'react';
import { Button } from '@heroui/button';
import { useOrganization } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

interface DownloadPDFButtonProps {
  reportType: 'super_admin' | 'organization' | 'member' | 'report_case';
  data?: Record<string, unknown>;
  filename: string;
  buttonText?: string;
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isIconOnly?: boolean;
  memberName?: string;
}

export const DownloadPDFButton: React.FC<DownloadPDFButtonProps> = ({
  reportType,
  data,
  filename,
  buttonText = 'Descargar PDF',
  variant = 'bordered',
  color = 'primary',
  size = 'sm',
  isIconOnly = false,
  memberName,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { organization } = useOrganization();
  const { user } = useUser();

  const handleDownload = async () => {
    try {
      setIsGenerating(true);

      // Prepare the request payload
      const payload: Record<string, unknown> = {
        reportType,
        filename,
      };

      // Add organization info if available
      if (organization) {
        payload.organizationName = organization.name;
        payload.organizationLogo = organization.imageUrl;
      }

      // Add member name if provided
      if (memberName) {
        payload.memberName = memberName;
      } else if (user) {
        payload.memberName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.username || 'Usuario';
      }

      // Add data for report_case type
      if (reportType === 'report_case' && data) {
        payload.data = data;
      }

      // Call the API instead of importing the service directly
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get the PDF blob from the response
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      isIconOnly={isIconOnly}
      onPress={handleDownload}
      isLoading={isGenerating}
      startContent={
        !isGenerating && !isIconOnly && (
          <i className="icon-[lucide--download] size-4" />
        )
      }
    >
      {isIconOnly ? (
        <i className="icon-[lucide--download] size-4" />
      ) : (
        buttonText
      )}
    </Button>
  );
}; 
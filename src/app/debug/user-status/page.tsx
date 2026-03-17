"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Button,
  Chip,
} from "@heroui/react";
import { useUser } from "@clerk/nextjs";

interface ClerkData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: number;
}

interface ClerkOrganization {
  id: string;
  name: string;
  slug: string;
  role: string;
  createdAt: number;
}

interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  membershipCount: number;
}

interface DatabaseOrganization {
  id: string;
  name: string;
  slug: string;
  role: string;
  createdAt: string;
}

interface Subscription {
  id: number;
  status: string;
  planType: string;
  organizationId: number | null;
  organizationName: string | null;
  organizationClerkId: string | null;
  createdAt: string;
  expiresAt: string | null;
  paymentStatus: string | null;
}

interface AdminStatus {
  isAdmin: boolean;
  email: string | null;
  adminEmails: string;
}

interface SyncStatus {
  clerkUserExists: boolean;
  clerkHasOrgs: boolean;
  databaseUserExists: boolean;
  databaseHasOrgs: boolean;
  hasActiveSubscription: boolean;
  subscriptionLinkedToOrg: boolean;
}

interface DebugInfo {
  timestamp: string;
  userId: string;
  clerkData: ClerkData | null;
  clerkOrganizations: ClerkOrganization[];
  clerkError: string | null;
  databaseUser: DatabaseUser | null;
  databaseOrganizations: DatabaseOrganization[];
  databaseError: string | null;
  subscriptions: Subscription[];
  subscriptionError: string | null;
  adminStatus: AdminStatus;
  syncStatus: SyncStatus;
  recommendations: string[];
}

export default function UserStatusDebugPage() {
  const { user, isLoaded } = useUser();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/users/org-status");
      const data = await response.json();

      if (response.ok && data.debug) {
        setDebugInfo(data.debug);
      } else {
        throw new Error(data.error || "Failed to fetch debug info");
      }
    } catch (err) {
      console.error("Error fetching debug info:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchDebugInfo();
    }
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Loading debug information..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card className="bg-danger-50 border-danger-200">
          <CardBody>
            <h2 className="text-xl font-bold text-danger-700 mb-2">
              Error Loading Debug Information
            </h2>
            <p className="text-danger-600">{error}</p>
            <Button
              color="danger"
              variant="flat"
              onClick={fetchDebugInfo}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!debugInfo) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardBody>
            <p>No debug information available.</p>
            <Button onClick={fetchDebugInfo} className="mt-4">
              Load Debug Info
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const getStatusChip = (
    status: boolean,
    trueText: string,
    falseText: string
  ) => (
    <Chip color={status ? "success" : "danger"} variant="flat">
      {status ? trueText : falseText}
    </Chip>
  );

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Status Debug</h1>
        <Button color="primary" onClick={fetchDebugInfo}>
          Refresh
        </Button>
      </div>

      <div className="text-sm text-gray-500">
        Last updated: {new Date(debugInfo.timestamp).toLocaleString()}
      </div>

      {/* Recommendations */}
      {debugInfo.recommendations.length > 0 && (
        <Card className="border-primary-200 bg-primary-50">
          <CardHeader>
            <h2 className="text-xl font-semibold text-primary-700">
              🎯 Recommendations
            </h2>
          </CardHeader>
          <CardBody className="space-y-2">
            {debugInfo.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border">
                {rec}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Sync Status Overview */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">📊 System Status Overview</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="font-medium">Clerk User</div>
            {getStatusChip(
              debugInfo.syncStatus.clerkUserExists,
              "✅ Found",
              "❌ Missing"
            )}
          </div>
          <div className="space-y-2">
            <div className="font-medium">Clerk Organizations</div>
            {getStatusChip(
              debugInfo.syncStatus.clerkHasOrgs,
              `✅ ${debugInfo.clerkOrganizations.length}`,
              "❌ None"
            )}
          </div>
          <div className="space-y-2">
            <div className="font-medium">Database User</div>
            {getStatusChip(
              debugInfo.syncStatus.databaseUserExists,
              "✅ Found",
              "❌ Missing"
            )}
          </div>
          <div className="space-y-2">
            <div className="font-medium">Database Organizations</div>
            {getStatusChip(
              debugInfo.syncStatus.databaseHasOrgs,
              `✅ ${debugInfo.databaseOrganizations.length}`,
              "❌ None"
            )}
          </div>
          <div className="space-y-2">
            <div className="font-medium">Active Subscription</div>
            {getStatusChip(
              debugInfo.syncStatus.hasActiveSubscription,
              "✅ Active",
              "❌ None"
            )}
          </div>
          <div className="space-y-2">
            <div className="font-medium">Subscription Linked</div>
            {getStatusChip(
              debugInfo.syncStatus.subscriptionLinkedToOrg,
              "✅ Linked",
              "❌ Unlinked"
            )}
          </div>
        </CardBody>
      </Card>

      {/* Admin Status */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">👑 Admin Status</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-medium">Status:</span>
            {getStatusChip(
              debugInfo.adminStatus.isAdmin,
              "Super Admin",
              "Regular User"
            )}
          </div>
          <div>
            <span className="font-medium">Email:</span>{" "}
            {debugInfo.adminStatus.email || "Not available"}
          </div>
          <div>
            <span className="font-medium">Admin Emails:</span>{" "}
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {debugInfo.adminStatus.adminEmails}
            </code>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clerk Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">🔐 Clerk Information</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {debugInfo.clerkError ? (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <div className="font-medium text-danger-700">
                  ❌ Clerk Error:
                </div>
                <div className="text-sm text-danger-600">
                  {debugInfo.clerkError}
                </div>
              </div>
            ) : debugInfo.clerkData ? (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">ID:</span>{" "}
                  {debugInfo.clerkData.id}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {debugInfo.clerkData.email}
                </div>
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {debugInfo.clerkData.firstName} {debugInfo.clerkData.lastName}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(debugInfo.clerkData.createdAt).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No Clerk data available</div>
            )}

            <div className="border-t pt-3">
              <div className="font-medium mb-2">
                Organizations ({debugInfo.clerkOrganizations.length}):
              </div>
              {debugInfo.clerkOrganizations.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.clerkOrganizations.map((org) => (
                    <div key={org.id} className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-gray-600">
                        ID: {org.id} | Role: {org.role} | Slug: {org.slug}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  No organizations found in Clerk
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Database Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">🗄️ Database Information</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {debugInfo.databaseError ? (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <div className="font-medium text-danger-700">
                  ❌ Database Error:
                </div>
                <div className="text-sm text-danger-600">
                  {debugInfo.databaseError}
                </div>
              </div>
            ) : debugInfo.databaseUser ? (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">ID:</span>{" "}
                  {debugInfo.databaseUser.id}
                </div>

                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {debugInfo.databaseUser.email}
                </div>
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {debugInfo.databaseUser.name}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(
                    debugInfo.databaseUser.createdAt
                  ).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Memberships:</span>{" "}
                  {debugInfo.databaseUser.membershipCount}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No database user found</div>
            )}

            <div className="border-t pt-3">
              <div className="font-medium mb-2">
                Organizations ({debugInfo.databaseOrganizations.length}):
              </div>
              {debugInfo.databaseOrganizations.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.databaseOrganizations.map((org) => (
                    <div key={org.id} className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-gray-600">
                        DB ID: {org.id} | Role: {org.role}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  No organizations found in database
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Subscription Information */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">💳 Subscription Information</h2>
        </CardHeader>
        <CardBody>
          {debugInfo.subscriptionError ? (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <div className="font-medium text-danger-700">
                ❌ Subscription Error:
              </div>
              <div className="text-sm text-danger-600">
                {debugInfo.subscriptionError}
              </div>
            </div>
          ) : debugInfo.subscriptions.length > 0 ? (
            <div className="space-y-3">
              {debugInfo.subscriptions.map((sub) => (
                <div key={sub.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">Subscription #{sub.id}</div>
                    <Chip
                      color={
                        sub.status === "ACTIVE"
                          ? "success"
                          : sub.status === "TRIALING"
                            ? "warning"
                            : "default"
                      }
                      variant="flat"
                    >
                      {sub.status}
                    </Chip>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Plan:</span> {sub.planType}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span>{" "}
                      {sub.expiresAt
                        ? new Date(sub.expiresAt).toLocaleDateString()
                        : "Never"}
                    </div>
                    <div>
                      <span className="font-medium">Payment:</span>{" "}
                      {sub.paymentStatus || "N/A"}
                    </div>
                  </div>
                  {sub.organizationId && (
                    <div className="mt-2 p-2 bg-success-50 rounded">
                      <div className="text-sm">
                        <span className="font-medium">
                          🏢 Linked to Organization:
                        </span>{" "}
                        {sub.organizationName} (ID: {sub.organizationId})
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No subscriptions found</div>
          )}
        </CardBody>
      </Card>

      {/* Raw Debug Data */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">🔍 Raw Debug Data</h2>
        </CardHeader>
        <CardBody>
          <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardBody>
      </Card>
    </div>
  );
}

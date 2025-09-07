/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: {
      $id: string;
      $createdAt: string;
      $updatedAt: string;
      name: string;
      registration: string;
      status: boolean;
      labels: string[];
      passwordUpdate: string;
      email: string;
      phone: string;
      emailVerification: boolean;
      phoneVerification: boolean;
      mfa: boolean;
      prefs: Record<string, any>;
      targets: Array<{
        $id: string;
        $createdAt: string;
        $updatedAt: string;
        name: string;
        userId: string;
        providerType: string;
        identifier: string;
      }>;
      accessedAt: string;
    } | null;
  }
}
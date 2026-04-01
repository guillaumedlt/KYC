"use server";

import { extractIdentity, extractAddress, extractFundsSource, extractCompanyDocument, classifyDocument, screenName } from "@/lib/ai/claude";

/**
 * Extract identity from an uploaded document image.
 * Uses Claude Sonnet with vision — ~$0.01 per call.
 */
export async function aiExtractIdentity(base64: string, mediaType?: string) {
  try {
    return await extractIdentity(base64, mediaType);
  } catch (error) {
    console.error("AI identity extraction failed:", error);
    return null;
  }
}

/**
 * Extract address from proof of address.
 * Uses Claude Sonnet with vision — ~$0.01 per call.
 */
export async function aiExtractAddress(base64: string) {
  try {
    return await extractAddress(base64);
  } catch (error) {
    console.error("AI address extraction failed:", error);
    return null;
  }
}

/**
 * Extract funds source from financial document.
 * Uses Claude Sonnet with vision — ~$0.01 per call.
 */
export async function aiExtractFunds(base64: string) {
  try {
    return await extractFundsSource(base64);
  } catch (error) {
    console.error("AI funds extraction failed:", error);
    return null;
  }
}

/**
 * Extract company info from corporate document.
 * Uses Claude Sonnet with vision — ~$0.01 per call.
 */
export async function aiExtractCompany(base64: string, docType: string) {
  try {
    return await extractCompanyDocument(base64, docType);
  } catch (error) {
    console.error("AI company extraction failed:", error);
    return null;
  }
}

/**
 * Classify document type from filename.
 * Uses Claude Haiku — ~$0.001 per call (10x cheaper).
 */
export async function aiClassifyDocument(fileName: string, textContent?: string) {
  try {
    return await classifyDocument(fileName, textContent);
  } catch (error) {
    console.error("AI classification failed:", error);
    return null;
  }
}

/**
 * Screen a name for PEP/sanctions.
 * Uses Claude Haiku — ~$0.001 per call.
 * NOTE: For production, this should hit real PEP/sanctions databases.
 * Claude is used as a preliminary filter only.
 */
export async function aiScreenName(name: string, nationality: string | null) {
  try {
    return await screenName(name, nationality);
  } catch (error) {
    console.error("AI screening failed:", error);
    return null;
  }
}

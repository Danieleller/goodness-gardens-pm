import { db } from "@/db";
import { rocks } from "@/db/schema";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

const DANIEL = "ba5e6be9-91a2-4a8c-bdd5-ef4276778c24";
const CONNOR = "5750608d-f04c-45c7-876b-f4a5102439bc";
const DAEL = "8481a3d6-1bdc-41ae-8497-7fdd6afa5b2a";

type RockData = [string, string, string | null, string, number, string | null];

const allRocks: RockData[] = [
  // === Q1 2026 ===
  ["r-q1-dael-1", "MX set-up and Execution", DAEL, "Q1-2026", 1, null],
  ["r-q1-dael-2", "Decision on Thermoforming machines in TX", DAEL, "Q1-2026", 2, null],
  ["r-q1-dael-3", "Decision whether to move forward with PA Packing", DAEL, "Q1-2026", 3, null],
  ["r-q1-dael-4", "Use H2A in Pearsall Decision", DAEL, "Q1-2026", 4, null],
  ["r-q1-brian-1", "Finish greenhouse expansion", null, "Q1-2026", 1, "Owner: Brian"],
  ["r-q1-brian-2", "Finish design of pinchz, tomato paste including machine purchase", null, "Q1-2026", 2, "Owner: Brian"],
  ["r-q1-brian-3", "Redesign potted rack", null, "Q1-2026", 3, "Owner: Brian"],
  ["r-q1-brian-4", "Organic restart", null, "Q1-2026", 4, "Owner: Brian"],
  ["r-q1-brian-5", "Working on the Tmachines to perfect the automation", null, "Q1-2026", 5, "Owner: Brian"],
  ["r-q1-bruce-1", "PA irrigation plan", null, "Q1-2026", 1, "Owner: Bruce"],
  ["r-q1-bruce-2", "Rooted Liners for locations", null, "Q1-2026", 2, "Owner: Bruce"],
  ["r-q1-bruce-3", "Continue with soil mixing and explore PA automation and cogen", null, "Q1-2026", 3, "Owner: Bruce"],
  ["r-q1-bruce-4", "Support Tayorville Demo", null, "Q1-2026", 4, "Owner: Bruce"],
  ["r-q1-bruce-5", "Utilities per location", null, "Q1-2026", 5, "Owner: Bruce"],
  ["r-q1-bruce-6", "Inventory of All Assets", null, "Q1-2026", 6, "Owner: Bruce"],
  ["r-q1-carlos-1", "Conclude 2024", null, "Q1-2026", 1, "Owner: Carlos"],
  ["r-q1-carlos-2", "1099s for 2025", null, "Q1-2026", 2, "Owner: Carlos"],
  ["r-q1-carlos-3", "FY25 Audit Prep", null, "Q1-2026", 3, "Owner: Carlos"],
  ["r-q1-carlos-4", "Hyper/Ramp Full Implementation", null, "Q1-2026", 4, "Owner: Carlos"],
  ["r-q1-carlos-5", "Staff additions", null, "Q1-2026", 5, "Owner: Carlos"],
  ["r-q1-john-1", "Get graphics designed for the Tickler lines that have been made, have them printed and distributed to supermarkets", null, "Q1-2026", 1, "Owner: John"],
  ["r-q1-john-2", "Produce show year planning", null, "Q1-2026", 2, "Owner: John"],
  ["r-q1-john-3", "Plan and implement sales strategy for all salespeople and brokers", null, "Q1-2026", 3, "Owner: John"],
  ["r-q1-daniel-1", "Build the Mexico Supply Plan", DANIEL, "Q1-2026", 1, null],
  ["r-q1-daniel-2", "NetSuite Live for Mexico", DANIEL, "Q1-2026", 2, null],
  ["r-q1-daniel-3", "Mexico and Overseas Suppliers Locked In", DANIEL, "Q1-2026", 3, null],
  ["r-q1-rachel-1", "Reviewing / updating all employee documents for start of year (policies, annual trainings, paperwork, etc)", null, "Q1-2026", 1, "Owner: Rachel"],
  ["r-q1-rachel-2", "Rearranging Indiana Admin / HR coverage (Jan - March, then March onwards)", null, "Q1-2026", 2, "Owner: Rachel"],
  ["r-q1-rachel-3", "Review of employee - who to keep / remove, pending MX and H2a", null, "Q1-2026", 3, "Owner: Rachel"],
  ["r-q1-rachel-4", "Review of Samsara and transition to paperless BOL", null, "Q1-2026", 4, "Owner: Rachel"],
  ["r-q1-connor-1", "Price increase, customer profitability", CONNOR, "Q1-2026", 1, null],
  ["r-q1-connor-2", "Decision (Go / No Go) on all assets. Complete Review.", CONNOR, "Q1-2026", 2, null],
  ["r-q1-connor-3", "Ensure all growing ops profitable", CONNOR, "Q1-2026", 3, null],
  ["r-q1-connor-4", "Location Analysis and Purge", CONNOR, "Q1-2026", 4, null],
  ["r-q1-dave-1", "MX Finance and Contract Set-up for Success", null, "Q1-2026", 1, "Owner: Dave"],
  ["r-q1-dave-2", "Audit Readiness", null, "Q1-2026", 2, "Owner: Dave"],
  ["r-q1-dave-3", "Support launch of first H2A program", null, "Q1-2026", 3, "Owner: Dave"],
  ["r-q1-dave-4", "FL Decision Model for Pack and Grow", null, "Q1-2026", 4, "Owner: Dave"],
  ["r-q1-dave-5", "Supporting general CAPEX ROI analysis across company", null, "Q1-2026", 5, "Owner: Dave"],
  ["r-q1-seth-1", "Establish standard of work for greenhouse activities in IN", null, "Q1-2026", 1, "Owner: Seth"],
  ["r-q1-seth-2", "Interim record system to track greenhouse production in IN", null, "Q1-2026", 2, "Owner: Seth"],
  ["r-q1-seth-3", "Comprehensive review of 2024-2025 TX field production", null, "Q1-2026", 3, "Owner: Seth"],
  ["r-q1-alexis-1", "Sales Forecast by sku, by week, by location", null, "Q1-2026", 1, "Owner: Alexis"],
  ["r-q1-alexis-2", "Develop sales reporting structure to monitor customer performance YOY and against budget", null, "Q1-2026", 2, "Owner: Alexis"],
  ["r-q1-alexis-3", "Account management support", null, "Q1-2026", 3, "Owner: Alexis"],
  ["r-q1-alexis-4", "Explore DTC", null, "Q1-2026", 4, "Owner: Alexis"],
  ["r-q1-alexis-5", "New customer on-boarding/credit request process", null, "Q1-2026", 5, "Owner: Alexis"],
  // === Q4 2025 ===
  ["r-q4-dael-1", "T-Day hiring", DAEL, "Q4-2025", 1, null],
  ["r-q4-dael-2", "T-Day storage", DAEL, "Q4-2025", 2, null],
  ["r-q4-dael-3", "T-Day Execution", DAEL, "Q4-2025", 3, null],
  ["r-q4-dael-4", "PA start-up", DAEL, "Q4-2025", 4, null],
  ["r-q4-brian-1", "Finish greenhouse", null, "Q4-2025", 1, "Owner: Brian"],
  ["r-q4-brian-2", "Restart organic", null, "Q4-2025", 2, "Owner: Brian"],
  ["r-q4-brian-3", "First design tomato pinchz", null, "Q4-2025", 3, "Owner: Brian"],
  ["r-q4-bruce-1", "PA winter plan", null, "Q4-2025", 1, "Owner: Bruce"],
  ["r-q4-bruce-2", "Increase PA herb sales", null, "Q4-2025", 2, "Owner: Bruce"],
  ["r-q4-bruce-3", "Irrigation in Indiana", null, "Q4-2025", 3, "Owner: Bruce"],
  ["r-q4-bruce-4", "Reduce waste", null, "Q4-2025", 4, "Owner: Bruce"],
  ["r-q4-bruce-5", "Inventory sale", null, "Q4-2025", 5, "Owner: Bruce"],
  ["r-q4-carlos-1", "Finish Review", null, "Q4-2025", 1, "Owner: Carlos"],
  ["r-q4-carlos-2", "2026 Budget", null, "Q4-2025", 2, "Owner: Carlos"],
  ["r-q4-carlos-3", "Finish Hypercard", null, "Q4-2025", 3, "Owner: Carlos"],
  ["r-q4-carlos-4", "PA regulatory set-up", null, "Q4-2025", 4, "Owner: Carlos"],
  ["r-q4-carlos-5", "Staff additions", null, "Q4-2025", 5, "Owner: Carlos"],
  ["r-q4-john-1", "Hire sales support", null, "Q4-2025", 1, "Owner: John"],
  ["r-q4-john-2", "Sell shippers", null, "Q4-2025", 2, "Owner: John"],
  ["r-q4-john-3", "Design and produce ticklers", null, "Q4-2025", 3, "Owner: John"],
  ["r-q4-daniel-1", "Move Conventional Supply to MX", DANIEL, "Q4-2025", 1, null],
  ["r-q4-daniel-2", "Start bags for TJs", DANIEL, "Q4-2025", 2, null],
  ["r-q4-daniel-3", "Dry Herbs move to MX", DANIEL, "Q4-2025", 3, null],
  ["r-q4-daniel-4", "Move Prod Supply Overseas", DANIEL, "Q4-2025", 4, null],
  ["r-q4-rachel-1", "Limit labor issue in NY", null, "Q4-2025", 1, "Owner: Rachel"],
  ["r-q4-rachel-2", "Staffing in PA", null, "Q4-2025", 2, "Owner: Rachel"],
  ["r-q4-rachel-3", "When to comply in NY", null, "Q4-2025", 3, "Owner: Rachel"],
  ["r-q4-rachel-4", "Document all processes", null, "Q4-2025", 4, "Owner: Rachel"],
  ["r-q4-connor-1", "Price increase, customer profitability", CONNOR, "Q4-2025", 1, null],
  ["r-q4-connor-2", "Wegmans puree pouch", CONNOR, "Q4-2025", 2, null],
  ["r-q4-connor-3", "Ensure all growing ops profitable", CONNOR, "Q4-2025", 3, null],
  ["r-q4-connor-4", "Decision on McGregors", CONNOR, "Q4-2025", 4, null],
  ["r-q4-connor-5", "Fresh Market Launch", CONNOR, "Q4-2025", 5, null],
];

export async function GET() {
  try {
    // Delete all existing rocks
    await db.delete(rocks);

    const now = new Date();

    // Insert all rocks
    for (const [id, title, owner, quarter, num, notes] of allRocks) {
      await db.insert(rocks).values({
        id,
        title,
        ownerUserId: owner,
        quarter,
        rockNumber: num,
        status: "not_started",
        progress: 0,
        notes,
        createdAt: now,
        updatedAt: now,
      } as any);
    }

    return NextResponse.json({
      success: true,
      count: allRocks.length,
      q1_2026: allRocks.filter(r => r[3] === "Q1-2026").length,
      q4_2025: allRocks.filter(r => r[3] === "Q4-2025").length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

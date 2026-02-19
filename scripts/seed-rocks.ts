import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

async function seedRocks() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  console.log("Seeding rocks into database...");

  // User IDs
  const userIds = {
    danielEller: "ba5e6be9-91a2-4a8c-bdd5-ef4276778c24",
    connorMurphy: "5750608d-f04c-45c7-876b-f4a5102439bc",
    daelEller: "8481a3d6-1bdc-41ae-8497-7fdd6afa5b2a",
  };

  const timestamp = new Date(1708300000 * 1000); // Convert Unix timestamp to Date

  // First, delete all existing rocks
  console.log("Cleaning up existing rocks...");
  await db.delete(schema.rocks);
  console.log("✓ Deleted all existing rocks");

  // Define all rocks data
  const rocksData = [
    // ===== Q1 2026 ROCKS =====

    // Dael Eller
    {
      title: "MX set-up and Execution",
      ownerUserId: userIds.daelEller,
      quarter: "Q1-2026",
      notes: null,
    },
    {
      title: "Decision on Thermoforming machines in TX",
      ownerUserId: userIds.daelEller,
      quarter: "Q1-2026",
      notes: null,
    },
    {
      title: "Decision whether to move forward with PA Packing",
      ownerUserId: userIds.daelEller,
      quarter: "Q1-2026",
      notes: null,
    },
    {
      title: "Use H2A in Pearsall Decision",
      ownerUserId: userIds.daelEller,
      quarter: "Q1-2026",
      notes: null,
    },

    // Brian
    {
      title: "Finish greenhouse expansion",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Brian",
    },
    {
      title: "Finish design of pinchz, tomato paste including machine purchase",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Brian",
    },
    {
      title: "Redesign potted rack",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Brian",
    },
    {
      title: "Organic restart",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Brian",
    },
    {
      title: "Working on the Tmachines to perfect the automation",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Brian",
    },

    // Bruce
    {
      title: "PA irrigation plan",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Bruce",
    },
    {
      title: "Rooted Liners for locations",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Bruce",
    },
    {
      title: "Continue with soil mixing and explore PA automation and cogen",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Bruce",
    },
    {
      title: "Support Tayorville Demo",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Bruce",
    },
    {
      title: "Utilities per location",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Bruce",
    },
    {
      title: "Inventory of All Assets",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Bruce",
    },

    // Carlos
    {
      title: "Conclude 2024",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Carlos",
    },
    {
      title: "1099s for 2025",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Carlos",
    },
    {
      title: "FY25 Audit Prep",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Carlos",
    },
    {
      title: "Hyper/Ramp Full Implementation",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Carlos",
    },
    {
      title: "Staff additions",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Carlos",
    },

    // John
    {
      title: "Get graphics designed for the Tickler lines that have been made, have them printed and distributed to supermarkets",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: John",
    },
    {
      title: "Produce show year planning",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: John",
    },
    {
      title: "Plan and implement sales strategy for all salespeople and brokers",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: John",
    },

    // Daniel Eller
    {
      title: "Build the Mexico Supply Plan",
      ownerUserId: userIds.danielEller,
      quarter: "Q1-2026",
      notes: null,
    },
    {
      title: "NetSuite Live for Mexico",
      ownerUserId: userIds.danielEller,
      quarter: "Q1-2026",
      notes: null,
    },
    {
      title: "Mexico and Overseas Suppliers Locked In",
      ownerUserId: userIds.danielEller,
      quarter: "Q1-2026",
      notes: null,
    },

    // Rachel
    {
      title: "Reviewing / updating all employee documents for start of year (policies, annual trainings, paperwork, etc)",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Rachel",
    },
    {
      title: "Rearranging Indiana Admin / HR coverage (Jan - March, then March onwards)",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Rachel",
    },
    {
      title: "Review of employee - who to keep / remove, pending MX and H2a",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Rachel",
    },
    {
      title: "Review of Samsara and transition to paperless BOL",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Rachel",
    },

    // Connor Murphy
    {
      title: "Price increase, customer profitability",
      ownerUserId: userIds.connorMurphy,
      quarter: "Q1-2026",
      notes: null,
    },
    {
      title: "Decision (Go / No Go) on all assets. Complete Review.",
      ownerUserId: userIds.connorMurphy,
      quarter: "Q1-2026",
      notes: null,
    },
    {
      title: "Ensure all growing ops profitable",
      ownerUserId: userIds.connorMurphy,
      quarter: "Q1-2026",
      notes: null,
    },
    {
      title: "Location Analysis and Purge",
      ownerUserId: userIds.connorMurphy,
      quarter: "Q1-2026",
      notes: null,
    },

    // Dave
    {
      title: "MX Finance and Contract Set-up for Success",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Dave",
    },
    {
      title: "Audit Readiness",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Dave",
    },
    {
      title: "Support launch of first H2A program",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Dave",
    },
    {
      title: "FL Decision Model for Pack and Grow",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Dave",
    },
    {
      title: "Supporting general CAPEX ROI analysis across company",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Dave",
    },

    // Seth
    {
      title: "Establish standard of work for greenhouse activities in IN",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Seth",
    },
    {
      title: "Interim record system to track greenhouse production in IN",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Seth",
    },
    {
      title: "Comprehensive review of 2024-2025 TX field production",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Seth",
    },

    // Alexis
    {
      title: "Sales Forecast by sku, by week, by location",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Alexis",
    },
    {
      title: "Develop sales reporting structure to monitor customer performance YOY and against budget",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Alexis",
    },
    {
      title: "Account management support",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Alexis",
    },
    {
      title: "Explore DTC",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Alexis",
    },
    {
      title: "New customer on-boarding/credit request process",
      ownerUserId: null,
      quarter: "Q1-2026",
      notes: "Owner: Alexis",
    },

    // ===== Q4 2025 ROCKS =====

    // Dael Eller
    {
      title: "T-Day hiring",
      ownerUserId: userIds.daelEller,
      quarter: "Q4-2025",
      notes: null,
    },
    {
      title: "T-Day storage",
      ownerUserId: userIds.daelEller,
      quarter: "Q4-2025",
      notes: null,
    },
    {
      title: "T-Day Execution",
      ownerUserId: userIds.daelEller,
      quarter: "Q4-2025",
      notes: null,
    },
    {
      title: "PA start-up",
      ownerUserId: userIds.daelEller,
      quarter: "Q4-2025",
      notes: null,
    },

    // Brian
    {
      title: "Finish greenhouse",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Brian",
    },
    {
      title: "Restart organic",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Brian",
    },
    {
      title: "First design tomato pinchz",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Brian",
    },

    // Bruce
    {
      title: "PA winter plan",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Bruce",
    },
    {
      title: "Increase PA herb sales",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Bruce",
    },
    {
      title: "Irrigation in Indiana",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Bruce",
    },
    {
      title: "Reduce waste",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Bruce",
    },
    {
      title: "Inventory sale",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Bruce",
    },

    // Carlos
    {
      title: "Finish Review",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Carlos",
    },
    {
      title: "2026 Budget",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Carlos",
    },
    {
      title: "Finish Hypercard",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Carlos",
    },
    {
      title: "PA regulatory set-up",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Carlos",
    },
    {
      title: "Staff additions",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Carlos",
    },

    // John
    {
      title: "Hire sales support",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: John",
    },
    {
      title: "Sell shippers",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: John",
    },
    {
      title: "Design and produce ticklers",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: John",
    },

    // Daniel Eller
    {
      title: "Move Conventional Supply to MX",
      ownerUserId: userIds.danielEller,
      quarter: "Q4-2025",
      notes: null,
    },
    {
      title: "Start bags for TJs",
      ownerUserId: userIds.danielEller,
      quarter: "Q4-2025",
      notes: null,
    },
    {
      title: "Dry Herbs move to MX",
      ownerUserId: userIds.danielEller,
      quarter: "Q4-2025",
      notes: null,
    },
    {
      title: "Move Prod Supply Overseas",
      ownerUserId: userIds.danielEller,
      quarter: "Q4-2025",
      notes: null,
    },

    // Rachel
    {
      title: "Limit labor issue in NY",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Rachel",
    },
    {
      title: "Staffing in PA",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Rachel",
    },
    {
      title: "When to comply in NY",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Rachel",
    },
    {
      title: "Document all processes",
      ownerUserId: null,
      quarter: "Q4-2025",
      notes: "Owner: Rachel",
    },

    // Connor Murphy
    {
      title: "Price increase, customer profitability",
      ownerUserId: userIds.connorMurphy,
      quarter: "Q4-2025",
      notes: null,
    },
    {
      title: "Wegmans puree pouch",
      ownerUserId: userIds.connorMurphy,
      quarter: "Q4-2025",
      notes: null,
    },
    {
      title: "Ensure all growing ops profitable",
      ownerUserId: userIds.connorMurphy,
      quarter: "Q4-2025",
      notes: null,
    },
    {
      title: "Decision on McGregors",
      ownerUserId: userIds.connorMurphy,
      quarter: "Q4-2025",
      notes: null,
    },
    {
      title: "Fresh Market Launch",
      ownerUserId: userIds.connorMurphy,
      quarter: "Q4-2025",
      notes: null,
    },
  ];

  // Insert all rocks
  console.log(`Inserting ${rocksData.length} rocks...`);
  for (const rock of rocksData) {
    await db.insert(schema.rocks).values({
      id: crypto.randomUUID(),
      title: rock.title,
      ownerUserId: rock.ownerUserId,
      quarter: rock.quarter,
      notes: rock.notes,
      status: "not_started",
      progress: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  console.log("✓ All rocks inserted successfully");

  console.log("\nSeed complete! Created:");
  console.log(`  - ${rocksData.length} rocks (${rocksData.filter(r => r.quarter === "Q1-2026").length} Q1 2026, ${rocksData.filter(r => r.quarter === "Q4-2025").length} Q4 2025)`);

  client.close();
}

seedRocks().catch(console.error);

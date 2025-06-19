"use server";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { MockInterview, UserAnswer } from "./schema";
import { eq, or, sql } from "drizzle-orm";

// Create the connection pool with better settings
const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000, // 10 seconds
  multipleStatements: false,
});

// Create the Drizzle instance with query logging in development
const db = drizzle(poolConnection, {
  mode: "default",
  logger: process.env.NODE_ENV === "development",
});

export async function createInterview(interviewData) {
  try {
    console.log("Creating interview with data:", {
      ...interviewData,
      jsonMockResp: interviewData.jsonMockResp.substring(0, 100) + "...", // Truncate for logging
    });

    // Validate required fields
    const requiredFields = [
      "mockId",
      "jsonMockResp",
      "jobPosition",
      "jobDesc",
      "jobExperience",
      "createdBy",
    ];
    const missingFields = requiredFields.filter(
      (field) => !interviewData[field]
    );

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      };
    }

    // Validate JSON format
    try {
      const parsedJson = JSON.parse(interviewData.jsonMockResp);
      if (!Array.isArray(parsedJson)) {
        throw new Error("Interview questions must be an array");
      }
      // Additional validation for each question
      parsedJson.forEach((q, idx) => {
        if (!q.Question || !q.Answer) {
          throw new Error(`Question ${idx + 1} is missing required fields`);
        }
      });
    } catch (error) {
      console.error("Invalid JSON format:", error);
      console.log("Raw JSON:", interviewData.jsonMockResp);
      return {
        success: false,
        error: "Invalid interview questions format: " + error.message,
      };
    }

    // Validate field lengths
    const maxLengths = {
      jobPosition: 255,
      jobDesc: 255,
      jobExperience: 255,
      createdBy: 255,
      mockId: 255,
    };

    for (const [field, maxLength] of Object.entries(maxLengths)) {
      if (interviewData[field]?.length > maxLength) {
        return {
          success: false,
          error: `${field} exceeds maximum length of ${maxLength} characters`,
        };
      }
    }

    // Test database connection before insert
    try {
      await poolConnection.query("SELECT 1");
      console.log("Database connection test successful");
    } catch (error) {
      console.error("Database connection test failed:", error);
      throw new Error("Database connection failed");
    }

    // Insert the interview
    console.log("Attempting database insertion with values:", {
      ...interviewData,
      jsonMockResp: "[truncated]", // Don't log the full JSON
      createdAt:
        interviewData.createdAt || new Date().toISOString().split("T")[0],
    });

    const resp = await db
      .insert(MockInterview)
      .values({
        ...interviewData,
        createdAt:
          interviewData.createdAt || new Date().toISOString().split("T")[0],
      })
      .execute();

    console.log("Database response:", resp);

    if (!resp) {
      console.error("Database insert failed - no response");
      throw new Error("Failed to insert interview into database");
    }

    console.log("Interview inserted successfully, fetching created record...");

    // Fetch the created interview
    const createdInterview = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, interviewData.mockId))
      .execute();

    if (!createdInterview || createdInterview.length === 0) {
      throw new Error("Interview created but failed to fetch");
    }

    console.log("Interview creation completed successfully");
    return {
      success: true,
      data: createdInterview[0],
      message: "Interview created successfully",
    };
  } catch (error) {
    console.error("Error creating interview:", error);
    // Enhanced error logging
    if (error.code) {
      console.error("SQL Error Details:", {
        code: error.code,
        state: error.sqlState,
        message: error.sqlMessage,
        errno: error.errno,
        sql: error.sql,
      });
    }
    return {
      success: false,
      error: error.message || "Failed to create interview",
      details: error.code
        ? `SQL Error: ${error.code} - ${error.sqlMessage}`
        : undefined,
    };
  }
}

export async function getInterviewList(clerkEmail, jwtEmail) {
  try {
    console.log("Fetching interviews for:", { clerkEmail, jwtEmail });

    if (!clerkEmail && !jwtEmail) {
      console.log("No authentication email provided");
      return [];
    }

    // Create an array of conditions for the OR query
    const emailConditions = [];
    if (clerkEmail)
      emailConditions.push(eq(MockInterview.createdBy, clerkEmail));
    if (jwtEmail) emailConditions.push(eq(MockInterview.createdBy, jwtEmail));

    console.log(
      "Querying with conditions:",
      emailConditions.map((c) => c.toString())
    );

    // First, let's check if the emails exist in the database
    const emailCheck = await db
      .select({ email: MockInterview.createdBy })
      .from(MockInterview)
      .where(or(...emailConditions))
      .execute();

    console.log(
      "Emails found in database:",
      emailCheck.map((e) => e.email)
    );

    const result = await db
      .select()
      .from(MockInterview)
      .where(or(...emailConditions))
      .orderBy(MockInterview.id)
      .execute();

    console.log(`Found ${result.length} interviews`);

    if (result.length === 0) {
      console.log("No interviews found for emails:", { clerkEmail, jwtEmail });
      // Let's check if there are any interviews in the table at all
      const totalCount = await db
        .select({ count: sql`count(*)` })
        .from(MockInterview)
        .execute();
      console.log("Total interviews in database:", totalCount[0]?.count);
    }

    return result;
  } catch (error) {
    console.error("Error fetching interview list:", error);
    if (error.code) {
      console.error("SQL Error Code:", error.code);
      console.error("SQL State:", error.sqlState);
      console.error("SQL Message:", error.sqlMessage);
    }
    return [];
  }
}

export async function getInterviewDetails(interviewId) {
  try {
    const result = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, interviewId))
      .execute();
    return result;
  } catch (error) {
    console.error("Error fetching interview details:", error);
    return [];
  }
}

export async function saveUserAnswer(answerData) {
  try {
    // Validate required fields
    const requiredFields = [
      "mockId",
      "question",
      "correctAns",
      "userAns",
      "feedback",
      "rating",
    ];
    const missingFields = requiredFields.filter((field) => !answerData[field]);

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      };
    }

    // Ensure rating is a string and within valid range
    const ratingNum = parseInt(answerData.rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
      return {
        success: false,
        error: "Rating must be a number between 1 and 10",
      };
    }

    // Ensure mockId exists in MockInterview table
    const interview = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, answerData.mockId))
      .execute();

    if (!interview || interview.length === 0) {
      return {
        success: false,
        error: "Interview not found",
      };
    }

    // Log the data being inserted
    console.log("Attempting to insert answer with data:", {
      ...answerData,
      userAns: answerData.userAns.substring(0, 20) + "...", // Truncate for logging
    });

    // Insert the answer
    const resp = await db
      .insert(UserAnswer)
      .values({
        ...answerData,
        createdAt:
          answerData.createdAt || new Date().toISOString().split("T")[0],
      })
      .execute();

    if (!resp || !resp.insertId) {
      console.error("Database insert failed:", resp);
      throw new Error("Failed to insert answer into database");
    }

    return {
      success: true,
      message: "Answer saved successfully",
      id: resp.insertId,
    };
  } catch (error) {
    console.error("Error saving user answer:", error);
    // Log more details about the error
    if (error.code) {
      console.error("SQL Error Code:", error.code);
      console.error("SQL State:", error.sqlState);
      console.error("SQL Message:", error.sqlMessage);
    }
    return {
      success: false,
      error: error.message || "Failed to save answer",
    };
  }
}

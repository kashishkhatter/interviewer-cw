'use server';

import { db } from './db';
import { MockInterview } from './schema';
import { eq, or } from 'drizzle-orm';

export async function getInterviewList(clerkEmail, jwtEmail) {
  try {
    // If either email is provided, search by that email
    if (clerkEmail || jwtEmail) {
      const result = await db
        .select()
        .from(MockInterview)
        .where(
          or(
            eq(MockInterview.createdBy, clerkEmail || ''),
            eq(MockInterview.createdBy, jwtEmail || '')
          )
        )
        .orderBy(MockInterview.id);
      return result;
    }
    return [];
  } catch (error) {
    console.error('Error fetching interview list:', error);
    return [];
  }
}

export async function getInterviewDetails(interviewId) {
  try {
    const result = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, interviewId));
    return result;
  } catch (error) {
    console.error('Error fetching interview details:', error);
    return [];
  }
} 
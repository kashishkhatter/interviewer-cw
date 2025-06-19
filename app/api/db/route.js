import { NextResponse } from 'next/server';
import { db } from '@/utils/db.server';
import { MockInterview, Question, UserAnswer } from '@/utils/schema';
import { eq, or, and } from 'drizzle-orm';

export async function POST(request) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'createInterview':
        const result = await db
          .insert(MockInterview)
          .values(data)
          .execute();
        return NextResponse.json({ success: true, data: result });

      case 'createQuestion':
        const questionResult = await db
          .insert(Question)
          .values(data)
          .execute();
        return NextResponse.json({ success: true, data: questionResult });

      case 'getInterviewList':
        const { clerkEmail, jwtEmail } = data;
        const interviews = await db
          .select()
          .from(MockInterview)
          .where(
            or(
              eq(MockInterview.createdBy, clerkEmail || ''),
              eq(MockInterview.createdBy, jwtEmail || '')
            )
          )
          .orderBy(MockInterview.id);
        return NextResponse.json({ success: true, data: interviews });

      case 'getInterviewDetails':
        const { interviewId } = data;
        const interview = await db
          .select()
          .from(MockInterview)
          .where(eq(MockInterview.mockId, interviewId))
          .execute();
        return NextResponse.json({ success: true, data: interview });

      case 'getUserAnswers':
        try {
          const { mockId, userEmail } = data;
          if (!mockId) {
            throw new Error('mockId is required');
          }

          const conditions = [eq(UserAnswer.mockId, mockId)];
          if (userEmail) {
            conditions.push(eq(UserAnswer.userEmail, userEmail));
          }

          const answers = await db
            .select()
            .from(UserAnswer)
            .where(and(...conditions))
            .execute();

          return NextResponse.json({ 
            success: true, 
            data: answers 
          });
        } catch (error) {
          console.error('Error fetching user answers:', error);
          return NextResponse.json({ 
            success: false, 
            error: error.message || 'Failed to fetch user answers',
            details: error.code ? `SQL Error: ${error.code} - ${error.sqlMessage}` : undefined
          }, { status: 500 });
        }

      case 'saveUserAnswer':
        try {
          // Validate and truncate fields if necessary
          const sanitizedData = {
            ...data,
            question: data.question.substring(0, 255), // Truncate question to fit varchar(255)
            userEmail: data.userEmail?.substring(0, 255),
            rating: data.rating?.substring(0, 255),
            mockId: data.mockId?.substring(0, 255)
          };

          const answerResult = await db
            .insert(UserAnswer)
            .values(sanitizedData)
            .execute();

          if (!answerResult) {
            throw new Error('Failed to insert answer - no result returned');
          }

          return NextResponse.json({ 
            success: true, 
            data: answerResult,
            message: 'Answer saved successfully'
          });
        } catch (error) {
          console.error('Error saving user answer:', error);
          // Log detailed error information
          if (error.code) {
            console.error('SQL Error Details:', {
              code: error.code,
              state: error.sqlState,
              message: error.sqlMessage,
              errno: error.errno
            });
          }
          return NextResponse.json({ 
            success: false, 
            error: error.message || 'Failed to save answer',
            details: error.code ? `SQL Error: ${error.code} - ${error.sqlMessage}` : undefined
          }, { status: 500 });
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Database operation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.code ? `SQL Error: ${error.code} - ${error.sqlMessage}` : undefined
      },
      { status: 500 }
    );
  }
} 
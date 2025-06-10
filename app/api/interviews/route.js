import { createInterview } from '@/utils/server-actions';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { 
      mockId,
      jsonMockResp,
      jobPosition,
      jobDesc,
      jobExperience,
      createdBy,
      createdAt
    } = body;

    if (!mockId || !jsonMockResp || !jobPosition || !jobDesc || !jobExperience || !createdBy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          details: {
            mockId: !mockId,
            jsonMockResp: !jsonMockResp,
            jobPosition: !jobPosition,
            jobDesc: !jobDesc,
            jobExperience: !jobExperience,
            createdBy: !createdBy
          }
        },
        { status: 400 }
      );
    }

    // Validate JSON response format
    try {
      const parsedJson = JSON.parse(jsonMockResp);
      if (!Array.isArray(parsedJson)) {
        throw new Error('Interview questions must be an array');
      }
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid interview questions format',
          details: error.message
        },
        { status: 400 }
      );
    }

    // Create the interview using server action
    const result = await createInterview({
      mockId,
      jsonMockResp,
      jobPosition,
      jobDesc,
      jobExperience,
      createdBy,
      createdAt: createdAt || new Date().toISOString().split('T')[0]
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data,
      message: 'Interview created successfully'
    });
  } catch (error) {
    console.error('Error in interview creation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create interview'
      },
      { status: 500 }
    );
  }
} 
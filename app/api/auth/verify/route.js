import { verifyToken } from '@/utils/jwt';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { 
          isValid: false, 
          error: 'No token provided' 
        },
        { status: 400 }
      );
    }

    const result = verifyToken(token);
    
    if (!result.isValid) {
      return NextResponse.json(
        { 
          isValid: false, 
          error: result.error 
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      isValid: true,
      userData: result.userData
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { 
        isValid: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// Keep GET endpoint for backward compatibility
export async function GET(request) {
  try {
    // Get token from query parameter or authorization header
    const token = request.nextUrl.searchParams.get('token') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ isValid: false, error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    
    const userData = {
      id: decoded.sub,
      email: decoded.user_email,
      username: decoded.username,
      roles: decoded.roles,
      tenant: decoded.tenant
    };

    // Set token in cookie
    const response = NextResponse.json({ 
      isValid: true, 
      userData 
    }, { status: 200 });

    // Set secure cookie with token
    response.cookies.set('jwt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ 
      isValid: false, 
      error: error.message 
    }, { status: 401 });
  }
} 
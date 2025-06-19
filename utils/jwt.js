import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; // The secret key provided

export function verifyToken(token) {
  try {
    console.log('Verifying token...');
    // Now using proper verification with the correct secret key
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    console.log('Token decoded successfully:', decoded);
    
    if (!decoded) {
      console.log('Token decoded but no data found');
      return {
        isValid: false,
        error: 'Invalid token format'
      };
    }

    const userData = {
      id: decoded.sub,
      email: decoded.user_email,
      username: decoded.username,
      roles: decoded.roles,
      tenant: decoded.tenant
    };

    console.log('Token verified successfully, user data:', userData);
    return {
      isValid: true,
      userData
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return {
      isValid: false,
      error: error.message
    };
  }
}

export function extractTokenFromRequest(req) {
  // Check query parameters
  const queryToken = req.nextUrl?.searchParams?.get('token');
  if (queryToken) {
    return queryToken;
  }

  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
} 
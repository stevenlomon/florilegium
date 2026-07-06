import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose'; // jose is used both here and in Python for jwt!

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const query1 = {
      name: 'fetch-username-match',
      text: 'SELECT * FROM "User" WHERE username = $1',
      values: [body.username],
    }
    const resp1 = await pool.query(query1);
    const user = resp1.rows[0];

    // Return early here if there is no match
    if (!user) {
      return NextResponse.json({
        success: "not ok"
      },
        { status: 401 }
      );
    }
    console.log("Login username match:", user.id);

    // Now that we have a username match, we check if the password match
    const query2 = {
      name: 'fetch-hashed-password',
      text: 'SELECT hashed_password FROM "Auth" WHERE user_id = $1',
      values: [user.id]
    }

    const resp2 = await pool.query(query2);
    const hashedPassword = resp2.rows[0].hashed_password;
    console.log("Hashed password:", hashedPassword);

    if (await bcrypt.compare(body.password, hashedPassword)) {
      // Initiate the session. I'm gonna dig up jwt knowledge from my Python days and deep layers of my memory here!
      // I'll implement custom manual jwt session management for now when me, my friends and family will be the only users. It's gonna be a nice
      // nod to my old Python days. And after some feedback once the app goes public for real for real, I'll give myself the luxury upgrade of 
      // outsourcing auth to Better Auth or Clerk

      // I'll compare and contrast with both the express-session Biscord code and the jwt Python code from xecution.ai and ClarityTracking 
      // as I write these lines of code
      // In Biscord, all we needed was one line of code `(req.session as any).userId = user.id;` haha, together with the session middleware

      // 1. Encode the secret key in .env.local
      // This has nothing to do with the JWT token creation, it simply encodes an English text string into raw computer bytes for the 
      // jose SignJWT method. This plain text -> Uint8Array<ArrayBuffer> encoding is done for us in the Python `jwt.encode()` method
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);

      // 2. Create the JWT token (putting our userId inside the token)
      // Here's where we actually build the token and use the equivalents of SECRET_KEY and algorithm=ALGORITHM from this line
      // of code in the Python version: `encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)`
      const token = await new SignJWT({ userId: user.id })
        .setProtectedHeader({ alg: 'HS256' }) // In Python, I had `ALGORITHM = "HS256"`
        .setIssuedAt() // No parameter, meaning default to current server time. Technically, a JWT token doesn't *need* an "Issued at" claim to work, but it's industry and security best practice. In my Python version, I actually skipped this it seems haha
        .setExpirationTime('7d') // In Python, I had `ACCESS_TOKEN_EXPIRE_MINUTES = 30 # A token will be valid for 30 minutes.` I'll stick with 7 days now in development and pre-beta when friends and family use it so that users don't have to constantly log in again all the time haha! 7d is also justified here sicne we're using cookies, see below
        .sign(secret); // The actual signing of the secret as raw bytes

      // 3. Set the cookie in the user's browser with the JWT token "baked into it"
      (await cookies()).set('book-momentum-session', token, {
        httpOnly: true, // This prevents JavaScript from reading our cookie (XSS attacks). Much safer than storing the token in localStorage which I would have done if I built a frontend for my Python backend. This also justifies the 7d expiration time vs 30 minutes
        secure: process.env.NODE_ENV === 'production', // Require HTTPS in production
        sameSite: 'lax', // CSRF protection. both express-session and Next.js defaults to 'lax' but it's good practice to write it explicitly so that the browser doesn't have to guess. 'lax' is the "sweet" middle spot between the two other options 'none' and 'strict'
        path: '/', // Make the cookie valid for the entire domain
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Matches our JWT token 7d in milliseconds
      });
      // 'saveUninitialized' and 'resave' exist in the Biscord express-session version because it stores data in the server's memory. In Next.js,
      // we don't store anything on the server, the cookie *is* the memory
      // And `secret: "super secret!",` from the session middleware is "replaced" with the JWT secret here in the Node version

      // Return success
      return NextResponse.json({
        success: "ok",
        data: {
          id: user.id,
          username: user.username,
        }
      });
    } else {
      // Password failed
      return NextResponse.json({ success: "not ok" }, { status: 401 });
    }
  } catch (err) {
    console.error("Unexpected error when trying to login", err);
    return NextResponse.json({ success: "not ok" }, { status: 500 });
  }
};

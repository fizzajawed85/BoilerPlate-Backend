# Testing Vercel Deployment

## Quick Test URLs

### GET Endpoints (Can test in browser)
- `https://your-app.vercel.app/` - ✅ Should show API info
- `https://your-app.vercel.app/test` - ✅ Should show server and DB status

### POST Endpoints (Need Postman/Thunder Client/curl)

#### 1. Register User
**Endpoint:** `POST https://your-app.vercel.app/api/auth/register`

**Body (JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test@123"
}
```

#### 2. Login User
**Endpoint:** `POST https://your-app.vercel.app/api/auth/login`

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "Test@123"
}
```

#### 3. Forgot Password
**Endpoint:** `POST https://your-app.vercel.app/api/auth/forgot-password`

**Body (JSON):**
```json
{
  "email": "test@example.com"
}
```

## Using Thunder Client (VS Code Extension)

1. Install Thunder Client extension
2. Create new request
3. Set method to POST
4. Enter URL
5. Go to Body tab → JSON
6. Paste the JSON body
7. Click Send

## Using curl (Command Line)

```bash
# Test Registration
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test@123"}'

# Test Login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

## Expected Responses

### Successful Registration (201)
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "_id": "...",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### Successful Login (200)
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "_id": "...",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

## Common Errors

### "Cannot GET /api/auth/register"
- ✅ **Normal!** This endpoint is POST, not GET
- Use Postman/Thunder Client/curl to test

### 500 Internal Server Error
- ❌ Check Vercel environment variables
- ❌ Check MongoDB connection string
- ❌ Check Vercel function logs

### 400 Bad Request
- ❌ Check request body format
- ❌ Ensure all required fields are present
- ❌ Check for duplicate username/email

# Stripe Payment Production Setup Guide

## Issue Identified
The payment form fails to load in production with the error:
```
TypeError: Cannot read properties of undefined (reading 'match')
XHR failed loading: POST "https://m.stripe.com/6" net::ERR_BLOCKED_BY_ADBLOCKER
```

## Root Cause
The `VITE_STRIPE_PUBLISHABLE_KEY` environment variable is not properly set in the production deployment.

## Required Environment Variables

### Production Environment (.env.production or Docker environment)
```bash
# Stripe Configuration (REQUIRED for payments to work)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here

# Or for testing in production:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
```

### Development Environment (.env)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
```

## Validation Steps

### 1. Check Environment Variable
The updated StripePaymentForm now includes debug logging:
- ✅ `Stripe publishable key loaded: pk_test_...`
- ❌ `VITE_STRIPE_PUBLISHABLE_KEY is not set`
- ❌ `Invalid Stripe publishable key format: [key]`

### 2. Check Browser Console
In production, open browser console and look for the Stripe key validation messages.

### 3. Verify Key Format
- **Test keys**: Start with `pk_test_`
- **Live keys**: Start with `pk_live_`

## Deployment Checklist

### Dockploy Deployment (Current Setup)
1. **Environment Variable**: Add `VITE_STRIPE_PUBLISHABLE_KEY` in Dockploy app's Environment tab
2. **Dockerfile Updated**: The client Dockerfile now includes:
   ```dockerfile
   ARG VITE_STRIPE_PUBLISHABLE_KEY
   ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
   ```
3. **Build Logs**: Check Dockploy build logs for: `VITE_STRIPE_PUBLISHABLE_KEY is set to pk_test...`

### Docker/Container Deployment
1. Add environment variable to docker-compose.yml or deployment config:
```yaml
environment:
  - VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Build-time vs Runtime
- **Vite variables** (prefixed with `VITE_`) are build-time variables
- Must be available during the build process, not just at runtime
- For Docker: set during `docker build` or use build args
- **Dockploy**: Environment variables from the Environment tab are automatically passed as build args

### Security Notes
- **Publishable keys** are safe to expose in client-side code
- **Secret keys** should never be in frontend code
- Keep test/live keys separate for different environments

## Error Handling Improvements
The StripePaymentForm now includes:
- ✅ Validation of publishable key presence and format
- ✅ Clear error messages for missing configuration
- ✅ Graceful fallback when Stripe fails to initialize
- ✅ Debug logging for production troubleshooting

## Testing Verification
After setting the environment variable:
1. Build and deploy the application
2. Open payment modal
3. Check browser console for Stripe validation messages
4. Payment form should load with Stripe elements

## Common Issues
- **AdBlockers**: May block Stripe requests, but shouldn't prevent initialization
- **HTTPS Requirement**: Stripe requires HTTPS in production
- **CORS Issues**: Ensure API and frontend domains are properly configured

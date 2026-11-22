export function authMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
  switch (code) {
    case 'invalid_credentials': return 'The email or password is incorrect. Check your details and try again.'
    case 'email_not_confirmed': return 'Confirm your email before signing in. Check your inbox and spam folder.'
    case 'email_address_not_authorized': return 'Email delivery for this address is unavailable right now. Contact the app owner.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many requests. Wait a few minutes, then try again.'
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'Email signup is temporarily unavailable. Try again later.'
    case 'weak_password': return 'Choose a stronger password using at least eight characters.'
    case 'same_password': return 'Choose a password different from your current password.'
    case 'reauthentication_needed': return 'Request a fresh reset link to verify your identity again.'
    default: return 'We couldn’t complete your request. Check your connection and try again.'
  }
}

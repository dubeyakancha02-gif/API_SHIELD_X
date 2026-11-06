import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { login } from '../services/api';

/**
 * API Shield - Secure Login Screen
 * Initial screen for unauthenticated visitors. Provides responsive visual styling,
 * real-time validation, password toggle, rate-limit feedback, and server authentication.
 */
export default function Login({ onLoginSuccess, backendNotice, isCheckingSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (data && data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0B1120',
      backgroundImage: 'radial-gradient(circle at 50% 20%, #1E293B 0%, #0B1120 70%)',
      padding: '1.5rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header / Brand Badge */}
        <div style={{
          backgroundColor: '#0F172A',
          padding: '2.25rem 2rem 2rem 2rem',
          textAlign: 'center',
          borderBottom: '1px solid #1E293B'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            border: '1px solid rgba(37, 99, 235, 0.35)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <Shield size={32} color="#38BDF8" />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#F8FAFC',
            letterSpacing: '-0.025em',
            margin: '0 0 0.35rem 0'
          }}>
            API Shield
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#94A3B8',
            margin: 0,
            lineHeight: 1.4
          }}>
            Educational Security Auditing & Defense Portal
          </p>
        </div>

        {/* Login Form Body */}
        <div style={{ padding: '2rem' }}>
          {backendNotice && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              padding: '0.875rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
              lineHeight: 1.4
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }} />
              <div>
                <strong>Server Notice:</strong> {backendNotice}
              </div>
            </div>
          )}

          {isCheckingSession && !backendNotice && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#F0F9FF',
              border: '1px solid #BAE6FD',
              color: '#0369A1',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              marginBottom: '1.25rem'
            }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Verifying existing session...</span>
            </div>
          )}

          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '0.875rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              lineHeight: 1.4
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '0.5rem'
              }}>
                Administrator Email
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                  }}
                  placeholder="admin@apishield.local"
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.6875rem 0.875rem 0.6875rem 2.5rem',
                    border: `1px solid ${fieldErrors.email ? '#EF4444' : '#CBD5E1'}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    backgroundColor: isLoading ? '#F8FAFC' : '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {fieldErrors.email && (
                <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                  }}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '0.6875rem 2.75rem 0.6875rem 2.5rem',
                    border: `1px solid ${fieldErrors.password ? '#EF4444' : '#CBD5E1'}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    backgroundColor: isLoading ? '#F8FAFC' : '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: isLoading ? '#93C5FD' : '#2563EB',
                color: '#FFFFFF',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background-color 150ms ease',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          {/* Security Badge Footer */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #F1F5F9',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: '#64748B',
              margin: 0,
              lineHeight: 1.4
            }}>
              🔒 Protected by server-side HttpOnly sessions, bcrypt hashing & CSRF prevention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


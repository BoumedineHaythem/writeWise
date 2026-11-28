import React, { useState } from 'react';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Card from '../components/Card';
import { api } from '../api/client';
import styles from './AuthPage.module.css';

function validate(fields, isSignUp) {
  const errors = {};
  if (!fields.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!fields.password) {
    errors.password = 'Password is required.';
  } else if (isSignUp && fields.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (isSignUp && !fields.name.trim()) {
    errors.name = 'Your name is required.';
  }
  return errors;
}

export default function SignUpPage({ onNavigate, onAuthSuccess }) {
  const [fields, setFields] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setErrors((current) => current[key] ? { ...current, [key]: '' } : current);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pending) return;
    const errs = validate(fields, true);
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length > 0) return;
    setPending(true);
    try {
      const user = await api.signup(fields.name.trim(), fields.email.trim(), fields.password);
      setSubmitted(true);
      setTimeout(() => onAuthSuccess(user), 1400);
    } catch (err) {
      if (Object.keys(err.fields).length) setErrors(err.fields);
      else setFormError(err.message);
    } finally {
      setPending(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.centeredPage}>
        <Card className={styles.successCard} role="status" aria-live="polite">
          <span className={styles.successIcon} aria-hidden="true">🎉</span>
          <h2>Your account is ready</h2>
          <p>Welcome to Writewise! Taking you to your dashboard…</p>
          <div className={styles.spinner} aria-hidden="true" />
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.centeredPage}>
      <Card className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Create your Writewise account</h1>
          <p className={styles.authSub}>Start your writing journey today.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <FormField
            id="signup-name"
            label="Your name"
            type="text"
            value={fields.name}
            onChange={set('name')}
            placeholder="e.g. Alex"
            error={errors.name}
            required
            autoComplete="name"
          />
          <FormField
            id="signup-email"
            label="Email address"
            type="email"
            value={fields.email}
            onChange={set('email')}
            placeholder="you@example.com"
            error={errors.email}
            required
            autoComplete="email"
          />
          <FormField
            id="signup-password"
            label="Password"
            type="password"
            value={fields.password}
            onChange={set('password')}
            placeholder="At least 8 characters"
            error={errors.password}
            required
            autoComplete="new-password"
            hint="Minimum 8 characters."
          />
          {formError && (
            <p className={styles.prototypeNote} role="alert">
              {formError}
            </p>
          )}
          <Button type="submit" fullWidth size="lg" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <button className={styles.linkBtn} onClick={() => onNavigate('login')}>
            Log in
          </button>
        </p>
      </Card>
    </div>
  );
}

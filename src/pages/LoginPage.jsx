import React, { useState } from 'react';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Card from '../components/Card';
import styles from './AuthPage.module.css';

function validate(fields) {
  const errors = {};
  if (!fields.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!fields.password) errors.password = 'Password is required.';
  return errors;
}

export default function LoginPage({ onNavigate, onAuthSuccess }) {
  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setErrors((current) => current[key] ? { ...current, [key]: '' } : current);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
      setTimeout(() => onAuthSuccess('Alex'), 1200);
    }
  };

  if (submitted) {
    return (
      <div className={styles.centeredPage}>
        <Card className={styles.successCard} role="status" aria-live="polite">
          <p className={styles.prototypeNote}>Prototype only: no credentials were checked and no session was saved.</p>
          <span className={styles.successIcon} aria-hidden="true">👋</span>
          <h2>Demo sign-in complete</h2>
          <p>Taking you to your dashboard…</p>
          <div className={styles.spinner} aria-hidden="true" />
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.centeredPage}>
      <Card className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Log in to Writewise</h1>
          <p className={styles.authSub}>Good to see you again.</p>
          <p className={styles.prototypeNote}>
            This demo accepts any valid-format email and a password. Nothing is verified or saved.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <FormField
            id="login-email"
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
            id="login-password"
            label="Password"
            type="password"
            value={fields.password}
            onChange={set('password')}
            placeholder="Your password"
            error={errors.password}
            required
            autoComplete="current-password"
          />
          <Button type="submit" fullWidth size="lg">
            Log in
          </Button>
        </form>

        <p className={styles.switchLink}>
          Don&apos;t have an account?{' '}
          <button className={styles.linkBtn} onClick={() => onNavigate('signup')}>
            Sign up for free
          </button>
        </p>
      </Card>
    </div>
  );
}

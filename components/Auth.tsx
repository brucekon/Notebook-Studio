
import React, { useState } from 'react';
import { NotebookIcon, GoogleIcon } from './common/Icons';

interface AuthProps {
  onLoginSuccess: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleSignIn = () => {
    // This is a simulation. In a real app, this would trigger an OAuth flow.
    const googleUser = 'gmail_user';
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[googleUser]) {
        // "Sign up" the google user if they don't exist
        const newUsers = { ...users, [googleUser]: 'google_auth_password' };
        localStorage.setItem('users', JSON.stringify(newUsers));
    }
    onLoginSuccess(googleUser);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    setError('');

    const users = JSON.parse(localStorage.getItem('users') || '{}');

    if (isLogin) {
      if (users[email] && users[email] === password) {
        onLoginSuccess(email);
      } else {
        setError('Invalid email or password.');
      }
    } else { // Sign Up
      if (users[email]) {
        setError('An account with this email already exists.');
      } else {
        const newUsers = { ...users, [email]: password };
        localStorage.setItem('users', JSON.stringify(newUsers));
        onLoginSuccess(email);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-2xl shadow-2xl">
        <div className="text-center">
            <NotebookIcon className="w-12 h-12 text-cyan-400 mx-auto" />
            <h1 className="mt-4 text-3xl font-bold text-slate-200">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="mt-2 text-slate-400">
              Enter your credentials to access your notebook.
            </p>
        </div>

        <div className="space-y-4">
            <button
                onClick={handleGoogleSignIn}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-600 rounded-lg shadow-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-colors"
            >
                <GoogleIcon className="w-5 h-5" />
                Continue with Google
            </button>
        </div>

        <div className="flex items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-sm font-semibold">OR</span>
            <div className="flex-grow border-t border-slate-700"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
            >
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="font-medium text-cyan-400 hover:text-cyan-300 focus:outline-none"
            >
                {isLogin ? 'Sign up' : 'Login'}
            </button>
        </p>

      </div>
    </div>
  );
};

export default Auth;

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import '@testing-library/jest-dom';
import React from 'react';

jest.mock('sonner', () => {
  const toastErrorMock = jest.fn();
  const toastSuccessMock = jest.fn();

  return {
    toast: {
      error: toastErrorMock,
      success: toastSuccessMock,
    },
    __mocks: {
      toastErrorMock,
      toastSuccessMock,
    },
  };
});

// Access mocked functions
const { toastErrorMock, toastSuccessMock } = jest.requireMock('sonner').__mocks;

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

const mockSignInWithPassword = jest.fn();
const mockSignInWithOAuth = jest.fn();

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation error if email or password is missing', async () => {
    render(<LoginPage />);
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith('Please enter both email and password')
    );
  });

  it('calls supabase signInWithPassword on submit', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null,
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret',
      });
    });

    expect(toastSuccessMock).toHaveBeenCalledWith('Login successful');
    expect(pushMock).toHaveBeenCalledWith('/');
    expect(refreshMock).toHaveBeenCalled();
  });

  it('shows error toast if signInWithPassword returns error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid credentials' },
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('calls signInWithOAuth when clicking Google button', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });

    render(<LoginPage />);
    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);

    await waitFor(() =>
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
    );
  });
});

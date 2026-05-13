import { Amplify } from 'aws-amplify';
import { configureAmplify } from '@/lib/auth/amplify-config';

jest.mock('aws-amplify', () => ({
  Amplify: { configure: jest.fn() },
}));

const mockConfigure = Amplify.configure as jest.Mock;

const ENV_KEYS = [
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
  'NEXT_PUBLIC_COGNITO_CLIENT_ID',
  'NEXT_PUBLIC_COGNITO_DOMAIN',
] as const;

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  ENV_KEYS.forEach((k) => {
    if (values[k] !== undefined) {
      process.env[k] = values[k];
    } else {
      delete process.env[k];
    }
  });
}

beforeEach(() => {
  mockConfigure.mockClear();
  ENV_KEYS.forEach((k) => delete process.env[k]);
});

describe('configureAmplify', () => {
  it('calls Amplify.configure exactly once', () => {
    configureAmplify();
    expect(mockConfigure).toHaveBeenCalledTimes(1);
  });

  it('uses empty strings for all values when env vars are absent', () => {
    configureAmplify();

    expect(mockConfigure).toHaveBeenCalledWith({
      Auth: {
        Cognito: {
          userPoolId: '',
          userPoolClientId: '',
          loginWith: { email: true },
        },
      },
    });
  });

  it('passes userPoolId and userPoolClientId from env vars', () => {
    setEnv({
      NEXT_PUBLIC_COGNITO_USER_POOL_ID: 'us-east-2_TestPool',
      NEXT_PUBLIC_COGNITO_CLIENT_ID: 'test-client-id',
    });

    configureAmplify();

    const call = mockConfigure.mock.calls[0][0];
    expect(call.Auth.Cognito.userPoolId).toBe('us-east-2_TestPool');
    expect(call.Auth.Cognito.userPoolClientId).toBe('test-client-id');
  });

  it('omits oauth block when NEXT_PUBLIC_COGNITO_DOMAIN is not set', () => {
    setEnv({
      NEXT_PUBLIC_COGNITO_USER_POOL_ID: 'us-east-2_TestPool',
      NEXT_PUBLIC_COGNITO_CLIENT_ID: 'test-client-id',
    });

    configureAmplify();

    const { loginWith } = mockConfigure.mock.calls[0][0].Auth.Cognito;
    expect(loginWith).toEqual({ email: true });
    expect(loginWith.oauth).toBeUndefined();
  });

  it('omits oauth block when NEXT_PUBLIC_COGNITO_DOMAIN is an empty string', () => {
    setEnv({ NEXT_PUBLIC_COGNITO_DOMAIN: '' });

    configureAmplify();

    const { loginWith } = mockConfigure.mock.calls[0][0].Auth.Cognito;
    expect(loginWith.oauth).toBeUndefined();
  });

  it('includes oauth block with correct shape when NEXT_PUBLIC_COGNITO_DOMAIN is set', () => {
    setEnv({
      NEXT_PUBLIC_COGNITO_USER_POOL_ID: 'us-east-2_TestPool',
      NEXT_PUBLIC_COGNITO_CLIENT_ID: 'test-client-id',
      NEXT_PUBLIC_COGNITO_DOMAIN: 'auth.vigilhq.auth.us-east-2.amazoncognito.com',
    });

    configureAmplify();

    const { loginWith } = mockConfigure.mock.calls[0][0].Auth.Cognito;
    expect(loginWith.email).toBe(true);
    expect(loginWith.oauth).toEqual({
      domain: 'auth.vigilhq.auth.us-east-2.amazoncognito.com',
      scopes: ['email', 'profile', 'openid'],
      redirectSignIn: [
        'http://localhost:3000/auth/callback',
        'https://app.vigilhq.com/auth/callback',
      ],
      redirectSignOut: [
        'http://localhost:3000/login',
        'https://app.vigilhq.com/login',
      ],
      responseType: 'code',
    });
  });

  it('produces the full config object when all env vars are set', () => {
    setEnv({
      NEXT_PUBLIC_COGNITO_USER_POOL_ID: 'us-east-2_ABC123',
      NEXT_PUBLIC_COGNITO_CLIENT_ID: 'clientXYZ',
      NEXT_PUBLIC_COGNITO_DOMAIN: 'auth.example.com',
    });

    configureAmplify();

    expect(mockConfigure).toHaveBeenCalledWith({
      Auth: {
        Cognito: {
          userPoolId: 'us-east-2_ABC123',
          userPoolClientId: 'clientXYZ',
          loginWith: {
            email: true,
            oauth: {
              domain: 'auth.example.com',
              scopes: ['email', 'profile', 'openid'],
              redirectSignIn: [
                'http://localhost:3000/auth/callback',
                'https://app.vigilhq.com/auth/callback',
              ],
              redirectSignOut: [
                'http://localhost:3000/login',
                'https://app.vigilhq.com/login',
              ],
              responseType: 'code',
            },
          },
        },
      },
    });
  });
});

import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import LegacyLogo from '@/components/legacy-logo';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status }: Props) {
    return (
        <>
            <Head title="Log in" />

            <div className="legacy-login-topline" />
            <div className="legacy-login-card">
                <div className="legacy-login-logo">
                    <LegacyLogo />
                </div>
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="legacy-login-form"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="legacy-login-field">
                                <Label htmlFor="email">Username *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="Username"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="legacy-login-field">
                                <Label htmlFor="password">Password *</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="legacy-login-field">
                                <Label>Tick the Box *</Label>
                                <label className="legacy-recaptcha">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                    />
                                    <span>I'm not a robot</span>
                                    <b>reCAPTCHA</b>
                                </label>
                            </div>

                            <Button
                                type="submit"
                                className="legacy-login-button"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Login
                            </Button>
                        </>
                    )}
                </Form>
            </div>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check password (you can change this to any password you want)
    const correctPassword = 'PersonalBrandsFTW$100'; // Change this to your desired password

    if (password === correctPassword) {
      // Store authentication in localStorage
      localStorage.setItem('ascendAuth', 'true');
      // Redirect to home page
      window.location.href = '/';
    } else {
      setError('Invalid password. Please try again.');
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <svg width="96" height="193" viewBox="0 0 96 193" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-16 mx-auto mb-6">
            <mask id="mask0_40000211_2593" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="96" height="193">
              <path d="M46.2017 74.4207H0V39.8386C15.3084 40.2075 27.9424 37.4409 37.902 31.5389C49.7061 24.5303 56.0692 14.0173 56.9914 0H96V192.83H46.2017V74.4207Z" fill="#F7BD15"/>
            </mask>
            <g mask="url(#mask0_40000211_2593)">
              <path d="M-63.2188 58.4902L79.0829 -36.0768L120.337 26.001L-21.9647 120.568L-63.2188 58.4902Z" fill="#4486EC"/>
              <path d="M1.69531 145.803L143.997 51.2356L167.294 86.2929L24.9927 180.86L1.69531 145.803Z" fill="#F7BD15"/>
              <path d="M-22 120.533L120.302 25.9661L140.526 56.3983L-1.77618 150.965L-22 120.533Z" fill="#E24538"/>
              <path d="M11.7422 189.559L170.964 83.7471L203.142 132.168L43.9206 237.98L11.7422 189.559Z" fill="#36B157"/>
            </g>
          </svg>
          <h1 className="text-6xl font-bold text-slate-900 mb-2">Media List</h1>
          <p className="text-slate-600">Access the publication database</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary/10 rounded-full p-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 text-center mb-6">
            Password Protected
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-2">
                Enter Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-md transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Access Portal'}
            </Button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-6">
            This portal is password protected. Please enter the correct password to continue.
          </p>
        </div>
      </div>
    </div>
  );
}

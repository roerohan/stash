import { Navigate } from 'react-router-dom';

const LoginPage = () => {
  // Cloudflare Access handles the authentication.
  // Once the user is authenticated, they are brought to this page.
  // We just need to redirect them to the home page.
  return <Navigate to="/" replace />;
};

export default LoginPage;

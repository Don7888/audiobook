import SignInForm from '@/components/SignInForm';
export default function SignIn() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Sign In</h1>
      <div className="max-w-md mx-auto">
        <SignInForm />
      </div>
    </div>
  );
}
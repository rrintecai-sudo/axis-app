import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-6 px-4">
      <span className="text-4xl font-bold text-indigo-400 tracking-tight">AXIS</span>
      <SignIn
        appearance={{
          variables: {
            colorBackground: '#111111',
            colorText: '#F5F5F5',
            colorTextSecondary: '#71717A',
            colorPrimary: '#6366F1',
            colorInputBackground: '#1A1A1A',
            colorInputText: '#F5F5F5',
            borderRadius: '0.5rem',
          },
          elements: {
            card: 'border border-[#1F1F1F] shadow-none',
            headerTitle: 'text-[#F5F5F5]',
            headerSubtitle: 'text-[#71717A]',
            socialButtonsBlockButton: 'border-[#1F1F1F] bg-white/5 hover:bg-white/10 text-[#F5F5F5]',
            formFieldInput: 'border-[#1F1F1F]',
            footerAction: 'text-[#71717A]',
          },
        }}
      />
    </div>
  );
}
